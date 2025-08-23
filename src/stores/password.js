// src/stores/password.js (已修改为无验证模式)

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { zxcvbn } from '@zxcvbn-ts/core'
import { supabase } from '@/lib/supabaseClient'

// --- 加密相关的辅助函数已被移除 ---

// --- 密码生成辅助函数 (无变化) ---
function generatePassword(config) {
  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  }
  const similarChars = /[il1O0]/g
  let availableChars = ''
  if (config.useLowercase) availableChars += charSets.lowercase
  if (config.useUppercase) availableChars += charSets.uppercase
  if (config.useNumbers) availableChars += charSets.numbers
  if (config.useSymbols) availableChars += charSets.symbols
  if (config.excludeSimilar) availableChars = availableChars.replace(similarChars, '')
  if (availableChars.length === 0) return '请至少选择一个字符集'
  let password = ''
  const requiredChars = []
  if (config.useLowercase)
    requiredChars.push(charSets.lowercase[Math.floor(Math.random() * charSets.lowercase.length)])
  if (config.useUppercase)
    requiredChars.push(charSets.uppercase[Math.floor(Math.random() * charSets.uppercase.length)])
  if (config.useNumbers)
    requiredChars.push(charSets.numbers[Math.floor(Math.random() * charSets.numbers.length)])
  if (config.useSymbols)
    requiredChars.push(charSets.symbols[Math.floor(Math.random() * charSets.symbols.length)])
  for (let i = requiredChars.length; i < config.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length)
    requiredChars.push(availableChars[randomIndex])
  }
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]]
  }
  password = requiredChars.join('')
  const weakPasswordBlacklist = new Set(['123456', 'password', 'qwerty', 'admin123'])
  if (weakPasswordBlacklist.has(password)) {
    return generatePassword(config)
  }
  return password
}

// --- Pinia Store 定义 ---
export const usePasswordStore = defineStore('password', () => {
  // --- STATE ---
  // vaultStatus 和 encryptionKey 已被移除
  const isReady = ref(false) // 新增状态，表示数据是否加载完毕
  const isLoading = ref(false)
  const searchQuery = ref('')
  const config = ref({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeSimilar: true,
  })
  const currentGenerated = ref({
    password: '',
    strength: { score: 0, feedback: { suggestions: [], warning: '' } },
  })
  const archive = ref([])

  // --- GETTERS ---
  // isUnlocked 现在直接反映 isReady 状态
  const isUnlocked = computed(() => isReady.value)
  const filteredArchive = computed(() => {
    if (!searchQuery.value) return archive.value
    const query = searchQuery.value.toLowerCase()
    return archive.value.filter(
      (item) =>
        item.platform.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query)),
    )
  })

  // --- ACTIONS ---

  function sortArchive() {
    archive.value.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt),
    )
  }

  // [重写] loadVault 用于在应用启动时直接加载数据
  async function loadVault() {
    isLoading.value = true
    isReady.value = false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      // 直接从数据库获取明文数据
      // 注意：列名已从 'encrypted_data' 变为 'password_data'
      const { data, error } = await supabase
        .from('passwords')
        .select('id, password_data')
        .eq('user_id', user.id)

      if (error) throw error

      // 将获取的数据加载到 archive 中
      archive.value = data.map(item => ({
        id: item.id,
        ...item.password_data
      }))

      sortArchive()
      isReady.value = true // 数据加载完成，应用准备就绪
    } catch (error) {
      console.error('加载密码库失败:', error)
      archive.value = []
      throw error // 抛出错误给 UI 层处理
    } finally {
      isLoading.value = false
    }
  }

  function generateNewPassword() {
    const password = generatePassword(config.value)
    currentGenerated.value.password = password
    currentGenerated.value.strength = zxcvbn(password)
  }

  // [重写] 保存密码，不再加密
  async function savePassword(details) {
    if (!isReady.value) throw new Error('数据尚未准备好，无法保存。')
    isLoading.value = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录，无法保存。')

      const newEntry = {
        ...details,
        password: currentGenerated.value.password,
        strength: currentGenerated.value.strength.score,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
      }

      // 注意：列名为 'password_data'，存储的是普通 JSON 对象
      const { data, error } = await supabase
        .from('passwords')
        .insert({ user_id: user.id, password_data: newEntry })
        .select('id')
        .single()
      if (error) throw error

      archive.value.unshift({ id: data.id, ...newEntry })
      sortArchive()
    } finally {
      isLoading.value = false
    }
  }

  // [重写] 更新密码，不再加密
  async function updatePassword(id, updates) {
    if (!isReady.value) throw new Error('数据尚未准备好，无法更新。')
    isLoading.value = true
    try {
      const itemIndex = archive.value.findIndex((item) => item.id === id)
      if (itemIndex === -1) throw new Error('未找到要更新的项目。')

      const originalItem = archive.value[itemIndex]
      const updatedItem = { ...originalItem, ...updates, updatedAt: new Date().toISOString() }

      delete updatedItem.id // 从要存储的 JSON 中移除 id

      if (updates.password && updates.password !== originalItem.password) {
        if (!updatedItem.history) updatedItem.history = []
        updatedItem.history.unshift({
          password: originalItem.password,
          date: originalItem.updatedAt || originalItem.createdAt,
        })
        updatedItem.strength = zxcvbn(updates.password).score
      }

      // 注意：列名为 'password_data'
      const { error } = await supabase
        .from('passwords')
        .update({ password_data: updatedItem })
        .eq('id', id)
      if (error) throw error

      archive.value[itemIndex] = { id, ...updatedItem }
      sortArchive()
    } finally {
      isLoading.value = false
    }
  }

  async function deletePassword(id) {
    isLoading.value = true
    try {
      const { error } = await supabase.from('passwords').delete().eq('id', id)
      if (error) throw error
      archive.value = archive.value.filter((item) => item.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isReady,
    isUnlocked, // 保留 isUnlocked 以兼容现有模板
    isLoading,
    searchQuery,
    config,
    currentGenerated,
    archive,
    filteredArchive,
    loadVault, // 新的加载函数
    generateNewPassword,
    savePassword,
    deletePassword,
    updatePassword,
  }
})
