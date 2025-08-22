// src/stores/products.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

// 定义每页加载的商品数量，可以根据你的卡片大小调整
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

  // --- 新增搜索状态 ---
  const currentSearchQuery = ref('')

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  // ✨ 核心修改一：将查询构建逻辑提取出来，以便复用
  const buildQuery = () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    // 如果有搜索词，则添加过滤条件
    if (currentSearchQuery.value) {
      const searchTerm = `%${currentSearchQuery.value}%`
      // 使用 .or() 来同时搜索 name 和 description 字段
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }

    return query
  }

  // ✨ 核心修改二：fetchInitialProducts 使用新的 buildQuery
  async function fetchInitialProducts() {
    if (!authStore.user) return
    if (loading.value || loadingMore.value) return

    loading.value = true
    error.value = null
    products.value = []
    page.value = 1
    hasMore.value = true

    try {
      const from = 0
      const to = PAGE_SIZE - 1

      const query = buildQuery() // 使用构建函数
      const { data, error: fetchError } = await query.range(from, to)

      if (fetchError) throw fetchError

      if (data) {
        products.value = data
        if (data.length < PAGE_SIZE) {
          hasMore.value = false
        } else {
          page.value++
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

  // ✨ 核心修改三：fetchMoreProducts 也使用新的 buildQuery
  async function fetchMoreProducts() {
    if (loading.value || loadingMore.value || !hasMore.value || !authStore.user) return

    loadingMore.value = true
    try {
      const from = (page.value - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const query = buildQuery() // 使用构建函数
      const { data, error: fetchError } = await query.range(from, to)

      if (fetchError) throw fetchError

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

  // ✨ 新增：搜索功能的核心入口
  async function searchProducts(query) {
    const trimmedQuery = query.trim()
    // 如果搜索词没有变化，则不执行任何操作
    if (trimmedQuery === currentSearchQuery.value) return

    currentSearchQuery.value = trimmedQuery
    // 触发一次全新的数据加载，它会自动使用 currentSearchQuery
    await fetchInitialProducts()
  }

  function clearProducts() {
    products.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
    loading.value = false
    loadingMore.value = false
    // ✨ 清除时也重置搜索词
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
        ...productData, // 包含 name 和 description
        user_id: authStore.user.id,
        public_id: crypto.randomUUID(), // 在前端生成 public_id，确保立即可用
        thumbnail_url: imageUrls.length > 0 ? imageUrls[0] : null,
      }
      delete productToInsert.id // 确保不传递 id 字段进行插入

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
      // 1. 获取旧图片列表，用于对比和删除
      const { data: oldImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
      if (fetchError) throw fetchError

      const oldImageUrls = oldImages.map((img) => img.image_url)
      const existingImageUrls = existingImages.map((img) => img.image_url)

      // 2. 找出需要从 Storage 中删除的图片
      const imagesToDelete = oldImageUrls.filter((url) => !existingImageUrls.includes(url))
      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map(
          (url) => new URL(url).pathname.split('/product-images/')[1],
        )
        await supabase.storage.from('product-images').remove(pathsToDelete)
      }

      // 3. 上传新添加的图片
      const newImageUploadPromises = newImageFiles.map((file) => uploadProductImage(file))
      const newImageUrls = await Promise.all(newImageUploadPromises)

      // 4. 合并并准备最终要写入数据库的图片记录
      const finalImageUrls = [...existingImageUrls, ...newImageUrls]
      const finalImageRecords = finalImageUrls.map((url, index) => ({
        product_id: productId,
        image_url: url,
        position: index,
      }))

      // 5. 先删除旧的图片关系，再插入新的
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

      // 6. 更新 product 表本身
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

      // 7. 更新本地 state
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
        if (storageError) {
          console.error('未能从存储中移除部分图片:', storageError.message)
        }
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
    currentSearchQuery, // ✨ 导出新状态
    // actions
    fetchInitialProducts,
    fetchMoreProducts,
    clearProducts,
    searchProducts, // ✨ 导出新方法
    addProduct,
    updateProduct,
    deleteProduct,
    selectProductForDetailPage,
  }
})
