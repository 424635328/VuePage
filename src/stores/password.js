// src/stores/password.js (已修复所有 ESLint 错误)

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { zxcvbn } from '@zxcvbn-ts/core'
import * as CryptoJS from 'crypto-js'
import { supabase } from '@/lib/supabaseClient'

// -------------------
// 辅助函数 (无改动)
// -------------------

function deriveKey(password, salt) {
  const keySize = 256 / 32
  const iterations = 100000
  return CryptoJS.PBKDF2(password, salt, { keySize, iterations }).toString()
}

function encryptData(data, key) {
  const jsonString = JSON.stringify(data)
  return CryptoJS.AES.encrypt(jsonString, key).toString()
}

function decryptData(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key)
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8)
    if (!decryptedString) return null
    return JSON.parse(decryptedString)
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}

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
  const requiredChars = [];
  if (config.useLowercase) requiredChars.push(charSets.lowercase[Math.floor(Math.random() * charSets.lowercase.length)]);
  if (config.useUppercase) requiredChars.push(charSets.uppercase[Math.floor(Math.random() * charSets.uppercase.length)]);
  if (config.useNumbers) requiredChars.push(charSets.numbers[Math.floor(Math.random() * charSets.numbers.length)]);
  if (config.useSymbols) requiredChars.push(charSets.symbols[Math.floor(Math.random() * charSets.symbols.length)]);

  for (let i = requiredChars.length; i < config.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length)
    requiredChars.push(availableChars[randomIndex]);
  }

  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
  }
  password = requiredChars.join('');

  const weakPasswordBlacklist = new Set(['123456', 'password', 'qwerty', 'admin123']);
  if (weakPasswordBlacklist.has(password)) {
    return generatePassword(config)
  }
  return password
}


// -------------------
// Pinia Store 定义
// -------------------
export const usePasswordStore = defineStore('password', () => {
  // --- STATE ---
  const vaultStatus = ref('locked')
  const encryptionKey = ref(null)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const userSalt = ref(null)
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
  const isUnlocked = computed(() => vaultStatus.value === 'unlocked')
  const filteredArchive = computed(() => {
    if (!isUnlocked.value) return []
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

  async function checkVaultStatus() {
    isLoading.value = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('salt, password_verifier')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') throw new Error('当前用户的配置不存在。请尝试重新登录或联系技术支持。')
        throw new Error("无法获取用户配置。");
      }

      userSalt.value = profile.salt;
      if (profile && profile.password_verifier) {
        vaultStatus.value = 'locked';
      } else {
        vaultStatus.value = 'uninitialized';
      }
    } catch (error) {
      console.error("检查密码库状态失败:", error);
      vaultStatus.value = 'locked';
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function initializeWithAccountPassword(accountPassword) {
    isLoading.value = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: accountPassword,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("账户密码验证失败，请确认您输入的是正确的登录密码。");
        }
        throw new Error("验证账户时出错，请稍后重试。");
      }

      if (!userSalt.value) throw new Error("用户盐值不存在，无法初始化。");

      const derivedKey = deriveKey(accountPassword, userSalt.value);
      const verifier = "vault-check-ok";
      const encryptedVerifier = encryptData({ verifier }, derivedKey);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password_verifier: encryptedVerifier })
        .eq('id', user.id);

      if (updateError) throw new Error("创建密码库失败，请重试。");

      encryptionKey.value = derivedKey;
      archive.value = [];
      vaultStatus.value = 'unlocked';
      return true;

    } catch (error) {
      console.error("初始化密码库失败:", error);
      lockVault();
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function unlockWithAccountPassword(accountPassword) {
    isLoading.value = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('认证会话已失效，请重新登录。');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: accountPassword,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("账户密码验证失败，请确认您输入的是正确的登录密码。");
        }
        throw new Error("验证账户时出错，请稍后重试。");
      }

      const derivedKey = deriveKey(accountPassword, userSalt.value);

      const { data: encryptedDataFromDB, error: fetchError } = await supabase
        .from('passwords')
        .select('id, encrypted_data')
        .eq('user_id', user.id);

      if (fetchError) throw new Error('获取密码数据失败，请检查网络连接。');

      const decryptedArchive = [];
      for (const item of encryptedDataFromDB) {
        const decrypted = decryptData(item.encrypted_data, derivedKey);
        if (!decrypted) {
            console.error("数据解密失败，但密码已验证。可能存在数据损坏。Item ID:", item.id);
            continue;
        }
        decryptedArchive.push({ id: item.id, ...decrypted });
      }

      encryptionKey.value = derivedKey;
      archive.value = decryptedArchive.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      vaultStatus.value = 'unlocked';
      return true;

    } catch (error) {
      console.error('解锁失败:', error.message);
      lockVault();
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function lockVault() {
    encryptionKey.value = null;
    if (vaultStatus.value === 'unlocked') {
        vaultStatus.value = 'locked';
    }
    archive.value = [];
    searchQuery.value = '';
  }

  function generateNewPassword() {
    const password = generatePassword(config.value)
    currentGenerated.value.password = password
    currentGenerated.value.strength = zxcvbn(password)
  }

  // **修正：恢复 savePassword 的正确逻辑**
  async function savePassword(details) {
    if (!isUnlocked.value) throw new Error('密码库未解锁，无法保存。')
    isLoading.value = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录，无法保存。')

      const newEntry = {
        ...details,
        password: currentGenerated.value.password,
        createdAt: new Date().toISOString(),
        history: [],
      }
      const encryptedData = encryptData(newEntry, encryptionKey.value)

      // **修正：正确使用返回的 data**
      const { data, error } = await supabase
        .from('passwords')
        .insert({ user_id: user.id, encrypted_data: encryptedData })
        .select('id')
        .single()

      if (error) throw error

      // **修正：使用 unshift 添加新项目，而不是 filter**
      archive.value.unshift({ id: data.id, ...newEntry })
    } finally {
      isLoading.value = false
    }
  }

  // **修正：恢复完整的 deletePassword 函数**
  async function deletePassword(id) {
    if (!isUnlocked.value) throw new Error('密码库未解锁，无法删除。')
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
    // State
    vaultStatus,
    encryptionKey,
    isUnlocked,
    isLoading,
    searchQuery,
    config,
    currentGenerated,
    archive,
    // Getters
    filteredArchive,
    // Actions
    checkVaultStatus,
    initializeWithAccountPassword,
    unlockWithAccountPassword,
    lockVault,
    generateNewPassword,
    savePassword,
    deletePassword, // **修正：已恢复**
  }
})
