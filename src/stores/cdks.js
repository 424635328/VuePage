// src/stores/cdks.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

const PAGE_SIZE = 20

export const useCdksStore = defineStore('cdks', () => {
  // --- 状态 ---
  const cdks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const page = ref(1)
  const hasMore = ref(true)
  const loadingMore = ref(false)
  const searchQuery = ref('') // 新增：用于搜索的状态

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  // --- Actions ---

  /**
   * 核心数据获取函数，现在支持搜索
   */
  async function fetchCdks(isInitial = true) {
    if (!authStore.user) return
    if (loading.value || (loadingMore.value && !isInitial)) return

    if (isInitial) {
      loading.value = true
      error.value = null
      cdks.value = []
      page.value = 1
      hasMore.value = true
    } else {
      loadingMore.value = true
    }

    try {
      const from = isInitial ? 0 : (page.value - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('cdks')
        .select('id, public_id, name, cdk_key, is_used, created_at')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      // 如果有搜索词，添加 ilike 过滤器
      if (searchQuery.value) {
        query = query.ilike('name', `%${searchQuery.value}%`)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      if (data) {
        if (isInitial) {
          cdks.value = data
        } else {
          cdks.value.push(...data)
        }
        hasMore.value = data.length === PAGE_SIZE
        if (hasMore.value) {
          page.value++
        }
      } else {
        hasMore.value = false
      }
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `获取CDK列表失败: ${e.message}`, toastType: 'error' })
    } finally {
      if (isInitial) {
        loading.value = false
      } else {
        loadingMore.value = false
      }
    }
  }

  function fetchInitialCdks() {
    return fetchCdks(true)
  }

  function fetchMoreCdks() {
    return fetchCdks(false)
  }

  // 其他 action (addCdk, deleteCdk, clearCdks) 保持不变...
  // 以下是新增和修改的 Action

  async function addCdk(cdkData) {
    // ... 原有逻辑不变 ...
    if (!authStore.user) return null
    if (!cdkData.name || !cdkData.cdk_key) {
      toastStore.showToast({ msg: '名称和CDK内容不能为空', toastType: 'warning' })
      return null
    }
    try {
      const { data: newCdk, error: insertError } = await supabase
        .from('cdks')
        .insert({ ...cdkData, user_id: authStore.user.id })
        .select('id, public_id, name, cdk_key, is_used, created_at')
        .single()
      if (insertError) throw insertError
      cdks.value.unshift(newCdk)
      toastStore.showToast({ msg: 'CDK 添加成功！' })
      return newCdk
    } catch (e) {
      error.value = e.message
      toastStore.showToast({ msg: `添加失败: ${e.message}`, toastType: 'error' })
      return null
    }
  }

  /**
   * ✨ 新增：更新一个 CDK (支持乐观更新)
   * @param {number} cdkId
   * @param {object} updatedData - { name?, cdk_key?, is_used? }
   */
  async function updateCdk(cdkId, updatedData) {
    const index = cdks.value.findIndex((c) => c.id === cdkId)
    if (index === -1) return null

    const originalCdk = { ...cdks.value[index] }
    const updatedCdk = { ...originalCdk, ...updatedData }

    // 1. 乐观更新 UI
    cdks.value[index] = updatedCdk

    try {
      const { data, error: updateError } = await supabase
        .from('cdks')
        .update(updatedData)
        .eq('id', cdkId)
        .select('id, public_id, name, cdk_key, is_used, created_at')
        .single()

      if (updateError) throw updateError

      // 2. 用后端返回的权威数据再次更新 UI
      cdks.value[index] = data
      toastStore.showToast({ msg: '更新成功！' })
      return data
    } catch (e) {
      // 3. 如果失败，回滚 UI 并提示错误
      cdks.value[index] = originalCdk
      toastStore.showToast({ msg: `更新失败: ${e.message}`, toastType: 'error' })
      return null
    }
  }

  /**
   * ✨ 新增：批量删除 CDK
   * @param {Array<number>} idsToDelete
   */
  async function deleteMultipleCdks(idsToDelete) {
    if (idsToDelete.length === 0) return false

    // 1. 乐观更新：先从 UI 移除
    const originalCdks = [...cdks.value]
    cdks.value = cdks.value.filter((c) => !idsToDelete.includes(c.id))

    try {
      const { error: dbError } = await supabase.from('cdks').delete().in('id', idsToDelete)
      if (dbError) throw dbError

      toastStore.showToast({ msg: `成功删除 ${idsToDelete.length} 项` })
      return true
    } catch (e) {
      // 2. 回滚 UI
      cdks.value = originalCdks
      error.value = e.message
      toastStore.showToast({ msg: `批量删除失败: ${e.message}`, toastType: 'error' })
      return false
    }
  }

  async function deleteCdk(cdkId) {
    // ... 原有逻辑不变 ...
    const cdkToDeleteIndex = cdks.value.findIndex((c) => c.id === cdkId)
    if (cdkToDeleteIndex === -1) return false
    const cdkToDeleteData = cdks.value[cdkToDeleteIndex]
    cdks.value.splice(cdkToDeleteIndex, 1)
    try {
      const { error: dbError } = await supabase.from('cdks').delete().eq('id', cdkId)
      if (dbError) throw dbError
      toastStore.showToast({ msg: 'CDK 已成功删除' })
      return true
    } catch (e) {
      cdks.value.splice(cdkToDeleteIndex, 0, cdkToDeleteData)
      error.value = e.message
      toastStore.showToast({ msg: `删除失败: ${e.message}`, toastType: 'error' })
      return false
    }
  }

  function clearCdks() {
    cdks.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
    loading.value = false
    loadingMore.value = false
    searchQuery.value = '' // 清理时也要重置搜索词
  }

  return {
    // state
    cdks,
    loading,
    error,
    hasMore,
    loadingMore,
    searchQuery,
    // actions
    fetchInitialCdks,
    fetchMoreCdks,
    addCdk,
    updateCdk,
    deleteCdk,
    deleteMultipleCdks,
    clearCdks,
  }
})
