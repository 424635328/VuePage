// src/stores/products.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

// 定义每页加载的商品数量
const PAGE_SIZE = 12

export const useProductsStore = defineStore('products', () => {
  // --- 核心状态 ---
  const products = ref([])
  const loading = ref(false) // 用于【初始】加载
  const error = ref(null)
  const selectedProduct = ref(null)

  // --- 分页状态 ---
  const page = ref(1)
  const hasMore = ref(true)
  const loadingMore = ref(false) // 用于【加载更多时】的 loading 状态

  // --- 搜索状态 ---
  const currentSearchQuery = ref('')

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  // ✨ 优化一：封装核心的数据获取逻辑，调用数据库 RPC 函数
  // 这个函数现在是所有商品查询的唯一入口，无论是普通浏览还是搜索
  async function fetchProductsByPage(pageToFetch) {
    const from = (pageToFetch - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // 使用 .rpc() 调用我们在 Supabase 中创建的数据库函数
    const { data, error: fetchError } = await supabase
      .rpc('search_products', {
        // 传递函数需要的参数
        user_id_param: authStore.user.id,
        search_term: currentSearchQuery.value || '', // 确保传递的是字符串
      })
      .order('created_at', { ascending: false }) // RPC 返回的是表类型，可以继续链式调用
      .range(from, to)

    if (fetchError) throw fetchError
    return data
  }

  // ✨ 优化二：fetchInitialProducts 变得更简洁，只负责管理状态并调用核心获取函数
  async function fetchInitialProducts() {
    if (!authStore.user) return
    if (loading.value) return // 简化判断

    loading.value = true
    error.value = null
    products.value = []
    page.value = 1
    hasMore.value = true

    try {
      const data = await fetchProductsByPage(1)

      if (data) {
        products.value = data
        if (data.length < PAGE_SIZE) {
          hasMore.value = false
        } else {
          // 准备加载下一页
          page.value = 2
        }
      } else {
        hasMore.value = false
      }
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `获取商品失败: ${e.message}`, toastType: 'error' })
    } finally {
      loading.value = false
    }
  }

  // ✨ 优化三：fetchMoreProducts 也同样简化
  async function fetchMoreProducts() {
    if (loading.value || loadingMore.value || !hasMore.value || !authStore.user) return

    loadingMore.value = true
    try {
      const data = await fetchProductsByPage(page.value)

      if (data && data.length > 0) {
        products.value.push(...data)
        page.value++
        if (data.length < PAGE_SIZE) {
          hasMore.value = false
        }
      } else {
        hasMore.value = false
      }
    } catch (e) {
      console.error('加载更多失败:', e.message)
      toastStore.showToast({ msg: `加载更多失败: ${e.message}`, toastType: 'error' })
    } finally {
      loadingMore.value = false
    }
  }

  // ✨ 优化四：搜索函数的职责非常清晰：更新状态，然后重新加载
  async function searchProducts(query) {
    const trimmedQuery = query.trim()
    if (trimmedQuery === currentSearchQuery.value) return

    currentSearchQuery.value = trimmedQuery
    // 触发一次全新的数据加载，它会自动使用最新的 currentSearchQuery
    await fetchInitialProducts()
  }

  function clearProducts() {
    products.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
    loading.value = false
    loadingMore.value = false
    currentSearchQuery.value = ''
  }

  // --- 以下是未作修改的 CRUD 函数 ---

  async function uploadProductImage(file) {
    if (!authStore.user) throw new Error('用户未登录，无法上传。')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${authStore.user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function addProduct(productData, imageFiles) {
    loading.value = true
    error.value = null
    try {
      let imageUrls = []
      if (imageFiles && imageFiles.length > 0) {
        const imageUploadPromises = imageFiles.map((file) => uploadProductImage(file))
        imageUrls = await Promise.all(imageUploadPromises)
      }

      const productToInsert = {
        ...productData,
        user_id: authStore.user.id,
        public_id: crypto.randomUUID(),
        thumbnail_url: imageUrls.length > 0 ? imageUrls[0] : null,
      }
      delete productToInsert.id

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productToInsert)
        .select()
        .single()
      if (insertError) throw insertError

      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: newProduct.id,
          image_url: url,
          position: index,
        }))
        const { error: imageInsertError } = await supabase
          .from('product_images')
          .insert(imageRecords)
        if (imageInsertError) throw imageInsertError
      }

      // 如果当前没有搜索，则添加到列表顶部
      if (!currentSearchQuery.value) {
        products.value.unshift(newProduct)
      }
      toastStore.showToast({ msg: '商品添加成功！' })
      return newProduct
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `添加失败: ${e.message}`, toastType: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(productId, productData, newImageFiles, existingImages) {
    loading.value = true
    error.value = null
    try {
      const { data: oldImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
      if (fetchError) throw fetchError

      const oldImageUrls = oldImages.map((img) => img.image_url)
      const existingImageUrls = existingImages.map((img) => img.image_url)

      const imagesToDelete = oldImageUrls.filter((url) => !existingImageUrls.includes(url))
      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map(
          (url) => new URL(url).pathname.split('/product-images/')[1],
        )
        await supabase.storage.from('product-images').remove(pathsToDelete)
      }

      const newImageUploadPromises = newImageFiles.map((file) => uploadProductImage(file))
      const newImageUrls = await Promise.all(newImageUploadPromises)

      const finalImageUrls = [...existingImageUrls, ...newImageUrls]
      const finalImageRecords = finalImageUrls.map((url, index) => ({
        product_id: productId,
        image_url: url,
        position: index,
      }))

      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
      if (deleteError) throw deleteError

      if (finalImageRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('product_images')
          .insert(finalImageRecords)
        if (insertError) throw insertError
      }

      const thumbnail_url = finalImageUrls.length > 0 ? finalImageUrls[0] : null
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
        .single()
      if (updateError) throw updateError

      const index = products.value.findIndex((p) => p.id === productId)
      if (index !== -1) {
        products.value[index] = finalProduct
      }

      toastStore.showToast({ msg: '商品更新成功！' })
      return finalProduct
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `更新失败: ${e.message}`, toastType: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(productId) {
    const productToDeleteIndex = products.value.findIndex((p) => p.id === productId)
    if (productToDeleteIndex === -1) return false
    const productToDeleteData = products.value[productToDeleteIndex]

    products.value.splice(productToDeleteIndex, 1)

    try {
      const { data: images, error: fetchImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
      if (fetchImagesError) throw fetchImagesError

      if (images && images.length > 0) {
        const imageUrls = images.map((img) => img.image_url)
        const pathsToRemove = imageUrls.map(
          (url) => new URL(url).pathname.split('/product-images/')[1],
        )
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(pathsToRemove)
        if (storageError) console.error('未能从存储中移除部分图片:', storageError.message)
      }

      const { error: dbError } = await supabase.from('products').delete().eq('id', productId)
      if (dbError) throw dbError

      toastStore.showToast({ msg: '商品已成功删除' })
      return true
    } catch (e) {
      products.value.splice(productToDeleteIndex, 0, productToDeleteData)
      error.value = e.message
      toastStore.showToast({ msg: `删除失败: ${e.message}`, toastType: 'error' })
      return false
    }
  }

  function selectProductForDetailPage(product) {
    selectedProduct.value = product
  }

  return {
    // state
    products,
    selectedProduct,
    loading,
    error,
    hasMore,
    loadingMore,
    currentSearchQuery,
    // actions
    fetchInitialProducts,
    fetchMoreProducts,
    clearProducts,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    selectProductForDetailPage,
  }
})
