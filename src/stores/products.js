// src/stores/products.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const selectedProduct = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  function selectProductForDetailPage(product) {
    selectedProduct.value = product
  }

  async function fetchProducts() {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      products.value = data
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `获取商品失败: ${e.message}`, toastType: 'error' });
    } finally {
      loading.value = false
    }
  }

  function clearProducts() {
    products.value = []
  }

  async function uploadProductImage(file) {
    if (!authStore.user) throw new Error('用户未登录，无法上传。')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${authStore.user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  async function addProduct(productData, imageFiles) {
    loading.value = true;
    error.value = null;
    try {
      let imageUrls = [];
      if (imageFiles && imageFiles.length > 0) {
        const imageUploadPromises = imageFiles.map(file => uploadProductImage(file));
        imageUrls = await Promise.all(imageUploadPromises);
      }

      const productToInsert = {
        name: productData.name,
        description: productData.description,
        user_id: authStore.user.id,
        thumbnail_url: imageUrls.length > 0 ? imageUrls[0] : null,
      };

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productToInsert)
        .select()
        .single();
      if (insertError) throw insertError;

      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: newProduct.id,
          image_url: url,
          position: index,
        }));
        const { error: imageInsertError } = await supabase
          .from('product_images')
          .insert(imageRecords);
        if (imageInsertError) throw imageInsertError;
      }

      products.value.unshift(newProduct);
      toastStore.showToast({ msg: '商品添加成功！' });
      return newProduct;

    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `添加失败: ${e.message}`, toastType: 'error' });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateProduct(productId, productData, newImageFiles, existingImages) {
    loading.value = true;
    error.value = null;
    try {
        const { data: oldImages, error: fetchError } = await supabase
            .from('product_images').select('image_url').eq('product_id', productId);
        if (fetchError) throw fetchError;

        const oldImageUrls = oldImages.map(img => img.image_url);
        const existingImageUrls = existingImages.map(img => img.image_url);
        const imagesToDelete = oldImageUrls.filter(url => !existingImageUrls.includes(url));

        if (imagesToDelete.length > 0) {
            const pathsToDelete = imagesToDelete.map(url => new URL(url).pathname.split('/product-images/')[1]);
            await supabase.storage.from('product-images').remove(pathsToDelete);
        }

        const newImageUploadPromises = newImageFiles.map(file => uploadProductImage(file));
        const newImageUrls = await Promise.all(newImageUploadPromises);

        const finalImageUrls = [...existingImageUrls, ...newImageUrls];
        const finalImageRecords = finalImageUrls.map((url, index) => ({
            product_id: productId,
            image_url: url,
            position: index,
        }));

        const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteError) throw deleteError;

        if (finalImageRecords.length > 0) {
            const { error: insertError } = await supabase.from('product_images').insert(finalImageRecords);
            if (insertError) throw insertError;
        }

        const thumbnail_url = finalImageUrls.length > 0 ? finalImageUrls[0] : null;
        const { data: finalProduct, error: updateError } = await supabase
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                thumbnail_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .select()
            .single();
        if (updateError) throw updateError;

        const index = products.value.findIndex(p => p.id === productId);
        if (index !== -1) products.value[index] = finalProduct;

        toastStore.showToast({ msg: '商品更新成功！' });
        return finalProduct;
    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `更新失败: ${e.message}`, toastType: 'error' });
      return null
    } finally {
      loading.value = false;
    }
  }

  async function deleteProduct(productId) {
    loading.value = true;
    error.value = null;
    try {
      const { data: images, error: fetchImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchImagesError) throw fetchImagesError;

      if (images && images.length > 0) {
        const imageUrls = images.map(img => img.image_url);
        const pathsToRemove = imageUrls.map(url => new URL(url).pathname.split('/product-images/')[1]);
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(pathsToRemove);
        if (storageError) {
          console.error("未能从存储中移除部分图片:", storageError.message);
        }
      }

      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (dbError) throw dbError;

      products.value = products.value.filter(p => p.id !== productId);
      toastStore.showToast({ msg: '商品已成功删除' });
      return true;
    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `删除失败: ${e.message}`, toastType: 'error' });
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    selectedProduct,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    clearProducts,
    selectProductForDetailPage,
  }
})
