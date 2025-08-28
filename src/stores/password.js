import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { zxcvbn } from '@zxcvbn-ts/core'
import { supabase } from '@/lib/supabaseClient'

// --- [已升级] 密码生成辅助函数 ---
function generatePassword(config) {
  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  }

  // --- [优化] 预编译自定义排除项的正则表达式，避免重复创建 ---
  const customExclusionRegex = (config.excludeCustom && config.customExclusions)
    ? new RegExp(`[${config.customExclusions.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g')
    : null;

  let availableChars = ''
  if (config.useLowercase) availableChars += charSets.lowercase
  if (config.useUppercase) availableChars += charSets.uppercase
  if (config.useNumbers) availableChars += charSets.numbers
  if (config.useSymbols) availableChars += charSets.symbols

  // 1. 排除易混淆字符
  if (config.excludeSimilar) {
    const similarChars = /[il1O0]/g
    availableChars = availableChars.replace(similarChars, '')
  }

  // 2. [已优化] 使用预编译的正则表达式排除自定义字符
  if (customExclusionRegex) {
    availableChars = availableChars.replace(customExclusionRegex, '');
  }

  if (availableChars.length === 0) return '请至少选择一个字符集'

  let password = ''
  const requiredChars = []

  // 3. [新增] 强制包含每种字符
  if (config.forceInclude) {
    const applyExclusions = (charset) => customExclusionRegex ? charset.replace(customExclusionRegex, '') : charset;

    if (config.useLowercase) requiredChars.push(getRandomChar(applyExclusions(charSets.lowercase)))
    if (config.useUppercase) requiredChars.push(getRandomChar(applyExclusions(charSets.uppercase)))
    if (config.useNumbers) requiredChars.push(getRandomChar(applyExclusions(charSets.numbers)))
    if (config.useSymbols) requiredChars.push(getRandomChar(applyExclusions(charSets.symbols)))
  }

  // 填充剩余长度
  for (let i = requiredChars.length; i < config.length; i++) {
    requiredChars.push(getRandomChar(availableChars))
  }

  // 洗牌算法，打乱数组顺序
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]]
  }

  password = requiredChars.join('')

  // 避免生成弱密码（黑名单检查）
  const weakPasswordBlacklist = new Set(['123456', 'password', 'qwerty', 'admin123'])
  if (weakPasswordBlacklist.has(password)) {
    return generatePassword(config) // 递归调用以重新生成
  }

  return password
}

function getRandomChar(charset) {
  if (!charset) return '';
  return charset[Math.floor(Math.random() * charset.length)];
}


// --- Pinia Store 定义 ---
export const usePasswordStore = defineStore('password', () => {
  // --- STATE ---
  const isReady = ref(false)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const config = ref({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeSimilar: true,
    excludeCustom: false,
    customExclusions: '',
    forceInclude: true,
  })
  const currentGenerated = ref({
    password: '',
    strength: { score: 0, feedback: { suggestions: [], warning: '' } },
  })
  const archive = ref([])
  const selectedItems = ref(new Set())

  // --- GETTERS ---
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

  async function loadVault() {
    isLoading.value = true
    isReady.value = false
    clearSelection()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('passwords')
        .select('id, password_data')
        .eq('user_id', user.id)

      if (error) throw error

      archive.value = data.map(item => ({
        id: item.id,
        ...item.password_data
      }))

      sortArchive()
      isReady.value = true
    } catch (error) {
      console.error('加载密码库失败:', error)
      archive.value = []
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function generateNewPassword() {
    const password = generatePassword(config.value)
    currentGenerated.value.password = password
    currentGenerated.value.strength = zxcvbn(password)
  }

  async function savePassword(details, password, strengthScore) {
    if (!isReady.value) throw new Error('数据尚未准备好，无法保存。')
    isLoading.value = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录，无法保存。')

      const newEntry = {
        ...details,
        password: password,
        strength: strengthScore,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
      }

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

  async function updatePassword(id, updates) {
    if (!isReady.value) throw new Error('数据尚未准备好，无法更新。');
    isLoading.value = true;
    try {
      const itemIndex = archive.value.findIndex((item) => item.id === id);
      if (itemIndex === -1) throw new Error('未找到要更新的项目。');

      const originalItem = archive.value[itemIndex];

      // [修正] 创建一个最终用于本地状态的完整对象
      const finalItemForState = {
        ...originalItem,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // [关键] 检查密码是否更改，并以不可变的方式更新历史记录
      const passwordChanged = updates.password && updates.password !== originalItem.password;
      if (passwordChanged) {
        // 创建一个新的 history 数组副本，而不是修改旧的
        const newHistory = [...(originalItem.history || [])];
        newHistory.unshift({
          password: originalItem.password,
          date: originalItem.updatedAt || originalItem.createdAt,
        });

        finalItemForState.history = newHistory;
        finalItemForState.strength = zxcvbn(updates.password).score;
      }

      // [修正] 准备一个用于数据库的对象 (不包含 id)
      const itemForDatabase = { ...finalItemForState };
      delete itemForDatabase.id;

      const { error } = await supabase
        .from('passwords')
        .update({ password_data: itemForDatabase })
        .eq('id', id);
      if (error) throw error;

      // [关键] 用最终的、全新的对象更新本地状态，确保响应式
      archive.value[itemIndex] = finalItemForState;

      sortArchive();
    } finally {
      isLoading.value = false;
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

  function toggleSelection(id) {
    if (selectedItems.value.has(id)) {
      selectedItems.value.delete(id);
    } else {
      selectedItems.value.add(id);
    }
  }

  function selectAll(ids) {
    ids.forEach(id => selectedItems.value.add(id));
  }

  function clearSelection() {
    selectedItems.value.clear();
  }

  async function deleteMultiplePasswords() {
    isLoading.value = true;
    const idsToDelete = Array.from(selectedItems.value);
    try {
      const { error } = await supabase.from('passwords').delete().in('id', idsToDelete);
      if (error) throw error;

      archive.value = archive.value.filter(item => !idsToDelete.includes(item.id));
      clearSelection();
    } finally {
      isLoading.value = false;
    }
  }

  async function batchAddPasswords(items) {
    isLoading.value = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录，无法导入。');

      const newEntries = items.map(item => ({
        user_id: user.id,
        password_data: {
          platform: item.platform,
          label: item.label || '',
          notes: item.notes || '',
          password: item.password,
          strength: zxcvbn(item.password).score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [],
        },
      }));

      const { data, error } = await supabase.from('passwords').insert(newEntries).select('id, password_data');
      if (error) throw error;

      const newlyAddedItems = data.map(item => ({
        id: item.id,
        ...item.password_data
      }));

      archive.value.unshift(...newlyAddedItems);
      sortArchive();
      return newlyAddedItems.length;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isReady,
    isUnlocked,
    isLoading,
    searchQuery,
    config,
    currentGenerated,
    archive,
    filteredArchive,
    selectedItems,
    loadVault,
    generateNewPassword,
    savePassword,
    deletePassword,
    updatePassword,
    toggleSelection,
    selectAll,
    clearSelection,
    deleteMultiplePasswords,
    batchAddPasswords,
  }
})
