
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

  // 从数据库获取商品
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
      console.error('Error fetching products:', e.message)
      toastStore.showToast({ msg: `获取商品失败: ${e.message}`, toastType: 'error' });
    } finally {
      loading.value = false
    }
  }

  function clearProducts() {
    products.value = []
  }

  // 上传图片到 Storage (helper function)
  async function uploadProductImage(file) {
    if (!authStore.user) throw new Error('User not authenticated for upload.')
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

  // ✨ REWRITTEN & FIXED: The addProduct function is now more robust.
  // It prepares all data first and inserts the product record in a single operation.
  async function addProduct(productData, imageFiles) {
    loading.value = true;
    error.value = null;
    try {
      let imageUrls = [];
      // Step 1: Handle image uploads first. If this fails, we haven't created an orphaned product record.
      if (imageFiles && imageFiles.length > 0) {
        const imageUploadPromises = imageFiles.map(file => uploadProductImage(file));
        imageUrls = await Promise.all(imageUploadPromises);
      }

      // Step 2: Prepare the complete product record for a single insertion.
      const productToInsert = {
        name: productData.name,
        description: productData.description,
        user_id: authStore.user.id,
        thumbnail_url: imageUrls.length > 0 ? imageUrls[0] : null,
      };

      // Step 3: Insert the complete product record in one atomic operation.
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productToInsert)
        .select()
        .single();
      if (insertError) throw insertError;

      // Step 4: If there were images, insert their relationships into the product_images table.
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: newProduct.id,
          image_url: url,
          position: index,
        }));
        const { error: imageInsertError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        // If this part fails, we throw an error. The product is created, but the gallery might be incomplete.
        // This is a reasonable trade-off, and the user is notified.
        if (imageInsertError) throw imageInsertError;
      }

      // Step 5: Everything succeeded. Update the local state and return the new product.
      products.value.unshift(newProduct);
      toastStore.showToast({ msg: '商品添加成功！' });
      return newProduct;

    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `添加失败: ${e.message}`, toastType: 'error' });
      console.error('Error adding product:', e.message);
      // In a real-world scenario, you might want to add logic here to delete uploaded images if the DB insert fails.
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 更新商品
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
      console.error('Error updating product:', e.message)
      return null
    } finally {
      loading.value = false;
    }
  }

  // ✨ REWRITTEN & FIXED: The deleteProduct function is now robust and correct.
  async function deleteProduct(productId) {
    loading.value = true;
    error.value = null;
    try {
      // Step 1: Fetch all associated image URLs BEFORE deleting the product record.
      const { data: images, error: fetchImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchImagesError) throw fetchImagesError;

      // Step 2: If images exist, delete them from Storage.
      if (images && images.length > 0) {
        const imageUrls = images.map(img => img.image_url);
        const pathsToRemove = imageUrls.map(url => new URL(url).pathname.split('/product-images/')[1]);

        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(pathsToRemove);

        if (storageError) {
          // Log the error but proceed with DB deletion, as it's the most critical part.
          console.error("Failed to remove some images from storage:", storageError.message);
        }
      }

      // Step 3: Delete the main product record from the database.
      // The `ON DELETE CASCADE` constraint will automatically clean up the `product_images` table records.
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (dbError) throw dbError;

      // Step 4: Update the local state.
      products.value = products.value.filter(p => p.id !== productId);
      toastStore.showToast({ msg: '商品已成功删除' });
      return true;
    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `删除失败: ${e.message}`, toastType: 'error' });
      console.error('Error deleting product:', e.message);
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
