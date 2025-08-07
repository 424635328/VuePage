// src/stores/products.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

// 定义每页加载的商品数量
const PAGE_SIZE = 30;

export const useProductsStore = defineStore('products', () => {
  // --- 核心状态 ---
  const products = ref([])
  const loading = ref(false) // 用于初始加载
  const error = ref(null)
  const selectedProduct = ref(null) // 用于详情页，保持不变

  // --- ✨ 新增分页状态 ---
  const page = ref(1)
  const hasMore = ref(true) // 是否还有更多数据可供加载
  const loadingMore = ref(false) // 用于加载更多时的 loading 状态

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  // --- ✨ 新增：重置状态并获取第一页数据 ---
  // 这个函数将作为列表加载的入口点
  async function resetAndFetchProducts() {
    products.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
    // 调用 fetchProducts 并传入 isReset 标志
    await fetchProducts(true)
  }

  // --- ✨ 重构：核心的 fetch 方法，支持分页和重置 ---
  async function fetchProducts(isReset = false) {
    if (!authStore.user) return
    // 防止在加载更多时重复触发
    if (loadingMore.value || !hasMore.value) return

    if (isReset) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      // 计算 Supabase 的 range
      const from = (page.value - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .range(from, to) // ✨ 关键：使用 .range() 实现分页

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        // 将新获取的数据追加到现有数组
        products.value.push(...data)
        page.value++ // 准备加载下一页
        // 如果返回的数据量小于请求的页面大小，说明是最后一页
        if (data.length < PAGE_SIZE) {
          hasMore.value = false
        }
      } else {
        // 如果没有数据返回，说明已经没有更多了
        hasMore.value = false
      }
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `获取商品失败: ${e.message}`, toastType: 'error' })
    } finally {
      if (isReset) {
        loading.value = false
      } else {
        loadingMore.value = false
      }
    }
  }

  // --- ✨ 更新：清空商品时也重置分页状态 ---
  function clearProducts() {
    products.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
    loading.value = false
    loadingMore.value = false
  }

  // --- 以下 CRUD 操作保持不变，因为它们是高效的本地操作 ---
  // 它们直接修改 state，避免了重新请求整个列表

  async function addProduct(productData, imageFiles) {
    // ... 此函数逻辑完全保持不变 ...
    // 它通过 unshift 在本地数组顶部添加新项，这是最高效的方式。
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
    // ... 此函数逻辑完全保持不变 ...
    // 它在本地数组中找到并替换已更新的项，同样高效。
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
    // ... 此函数逻辑完全保持不变 ...
    // 它从本地数组中过滤掉已删除的项，无需网络请求刷新列表。
    // 注意：这里原有的 loading.value = true; 是可以保留的，因为它给用户一个删除操作正在进行的反馈
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

  async function uploadProductImage(file) {
    // ... 此函数逻辑完全保持不变 ...
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

  function selectProductForDetailPage(product) {
    // ... 此函数逻辑完全保持不变 ...
    selectedProduct.value = product
  }


  // --- 返回所有 state 和 actions ---
  return {
    // 原有 state 和 actions
    products,
    selectedProduct,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    clearProducts, // 已更新
    selectProductForDetailPage,

    // ✨ 新增/重构的 state 和 actions
    hasMore,
    loadingMore,
    fetchProducts, // 用于加载更多
    resetAndFetchProducts, // 用于初始加载
  }
})
