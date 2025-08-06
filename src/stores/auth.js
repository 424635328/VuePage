// src/stores/auth.js

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref(null)
  const session = ref(null)
  // loading 状态默认为 true，因为应用一加载就需要开始检查认证状态。
  const loading = ref(true)

  // --- Actions ---

  /**
   * 检查用户初始会话状态。
   * 这个函数在 App.vue 启动时被调用，是整个认证流程的起点。
   * 它解决了 "checkUser is not a function" 的错误。
   */
  async function checkUser() {
    try {
      // 异步地从 Supabase 获取当前会话信息
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // 如果存在有效会话，则更新 store 的状态
        session.value = data.session;
        user.value = data.session.user;
      }
    } catch (error) {
      console.error('检查用户会话时出错:', error);
    } finally {
      // 无论成功与否，只要检查操作完成，就将 loading 状态设为 false。
      // 这会“释放”路由守卫，允许它继续进行导航判断。
      loading.value = false;
    }
  }

  /**
   * 使用邮箱和密码注册新用户。
   */
  async function signUp({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // 注册成功后，Supabase 会发送确认邮件。用户和会话状态将由 onAuthStateChange 监听器在用户确认后更新。
    return data
  }

  /**
   * 验证用于注册确认的 OTP（一次性密码）。
   */
  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' // 明确这是用于注册的OTP
    })
    if (error) throw error
    // 验证成功后，onAuthStateChange 监听器会自动更新用户和会话状态。
    return data
  }

  /**
   * 使用邮箱和密码登录。
   */
  // ✨ 核心修复：让 signInWithPassword 主动更新状态
  async function signInWithPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // 关键：在函数返回前，立即同步更新状态
    session.value = data.session
    user.value = data.user

    return data
  }

  /**
   * 使用 GitHub 第三方提供商登录。
   */
  async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) console.error('使用 GitHub 登录时出错:', error.message);
  }

  /**
   * 用户登出。
   */
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('登出时出错:', error.message)
    // 登出后，onAuthStateChange 监听器会自动将 user 和 session 设为 null。
  }

  /**
   * 发送密码重置邮件。
   */
  async function sendPasswordResetEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // 修正：确保重定向路径与 router/index.js 中定义的路径一致。
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) throw error
  }

  /**
   * 重新发送账户确认邮件。
   */
  async function resendConfirmationEmail(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) throw error
  }

  /**
   * 由 App.vue 中的 onAuthStateChange 监听器调用，用于实时同步会话状态。
   * @param {object | null} newSession - Supabase 返回的最新 session 对象。
   */
  function setSession(newSession) {
    session.value = newSession
    user.value = newSession?.user ?? null
  }

  // --- 导出所有需要被外部使用的 state 和 actions ---
  return {
    user,
    session,
    loading,
    checkUser, // ✨ 导出 checkUser
    signUp,
    verifyOtp,
    signInWithPassword,
    signInWithGithub,
    signOut,
    sendPasswordResetEmail,
    resendConfirmationEmail,
    setSession, // ✨ 导出 setSession
  }
})
