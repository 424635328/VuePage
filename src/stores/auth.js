// src/stores/auth.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)

  // --- Auth state change listener ---
  supabase.auth.onAuthStateChange(async (event, newSession) => {
    session.value = newSession
    user.value = newSession?.user ?? null
    loading.value = false
  })

  // --- Actions ---

  async function signUp({ email, password }) {
    loading.value = true
    const { data, error } = await supabase.auth.signUp({ email, password })
    loading.value = false
    if (error) throw error
    return data
  }

  // ✨ NEW: Function to verify the OTP for signup confirmation
  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' // Specify that this is a signup confirmation OTP
    })
    if (error) throw error
    // On success, the onAuthStateChange listener will automatically update the user state
    return data
  }

  async function signInWithPassword({ email, password }) {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false
    if (error) throw error
    return data
  }

  async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) console.error('Error signing in with GitHub:', error.message);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error.message)
  }

  async function sendPasswordResetEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    })
    if (error) throw error
  }

  async function resendConfirmationEmail(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) throw error
  }

  return {
    user,
    session,
    loading,
    signUp,
    verifyOtp, // <-- Expose the new function
    signInWithPassword,
    signInWithGithub,
    signOut,
    sendPasswordResetEmail,
    resendConfirmationEmail,
  }
})
