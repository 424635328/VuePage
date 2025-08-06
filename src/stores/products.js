// src/stores/products.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast' // ✨ 1. Import the toast store

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()
  const toastStore = useToastStore() // ✨ 2. Instantiate the toast store

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
      // Optionally show a toast for fetch errors as well
      // toastStore.showToast({ msg: `获取商品失败: ${e.message}`, toastType: 'error' });
    } finally {
      loading.value = false
    }
  }

  // 上传图片到 Storage (no changes needed here)
  async function uploadProductImage(file) {
    if (!authStore.user) throw new Error('User not authenticated for upload.')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
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

  // 添加商品
  async function addProduct(productData, imageFile) {
    if (!authStore.user) return null
    loading.value = true
    error.value = null
    try {
      let imageUrl = productData.image_url || null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const { data, error: insertError } = await supabase
        .from('products')
        .insert({
          ...productData,
          image_url: imageUrl,
          user_id: authStore.user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      products.value.unshift(data)
      toastStore.showToast({ msg: '商品添加成功！' }); // ✨ 3. Show success toast
      return data
    } catch (e) {
      error.value = e.message;
      toastStore.showToast({ msg: `添加失败: ${e.message}`, toastType: 'error' }); // ✨ 4. Show error toast
      console.error('Error adding product:', e.message)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新商品
  async function updateProduct(productId, productData, imageFile) {
    loading.value = true
    error.value = null
    try {
      let imageUrl = productData.image_url;
      if (imageFile) {
         // 可选：在这里添加删除旧图片的逻辑
        imageUrl = await uploadProductImage(imageFile);
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update({
          ...productData,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) products.value[index] = data

      toastStore.showToast({ msg: '商品更新成功！' }); // ✨ 5. Show success toast
      return data
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `更新失败: ${e.message}`, toastType: 'error' }); // ✨ 6. Show error toast
      console.error('Error updating product:', e.message)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除商品
  async function deleteProduct(productId, imageUrl) {
    loading.value = true
    error.value = null
    try {
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (dbError) throw dbError

      if (imageUrl) {
        const path = new URL(imageUrl).pathname.split('/product-images/')[1];
        await supabase.storage.from('product-images').remove([path]);
      }

      products.value = products.value.filter(p => p.id !== productId)
      toastStore.showToast({ msg: '商品已成功删除' }); // ✨ 7. Show success toast
      return true
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `删除失败: ${e.message}`, toastType: 'error' }); // ✨ 8. Show error toast
      console.error('Error deleting product:', e.message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  }
})
