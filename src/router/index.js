// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  // 滚动行为：确保切换路由时页面滚动到顶部，或在浏览器后退/前进时恢复位置
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    // --- 信息与文档类页面 ---
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/TermsPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('../views/DocsPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsPage.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactPage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutPage.vue'),
    },
    // --- 商店相关路由 ---
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/shop/new',
      name: 'product-new',
      component: () => import('../views/ProductEditPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/shop/edit/:public_id',
      name: 'product-edit',
      component: () => import('../views/ProductEditPage.vue'),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: '/details/:public_id',
      name: 'product-details',
      component: () => import('../views/ProductDetailsPage.vue'),
      props: true,
    },
    // --- 用户账户与认证 ---
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/PasswordResetPage.vue'),
      meta: { title: 'Reset Password' },
    },
    // --- 核心工具类路由 ---
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/ImageEditorPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vault',
      name: 'file-vault',
      component: () => import('../views/FileVaultPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cdk-management',
      name: 'cdk-management',
      component: () => import('../views/CdkPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tools/password-generator',
      name: 'password-generator',
      component: () => import('../views/PasswordGeneratorPage.vue'),
      // 这是一个高度敏感的工具，必须要求用户认证
      meta: { requiresAuth: true },
    },
    // --- 404与重定向 ---
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('../views/NotFoundPage.vue'),
    },
    // 捕获所有未匹配路由，必须放在最后
    {
      path: '/:catchAll(.*)*',
      redirect: { name: 'NotFound' },
    },
  ],
})

/**
 * 全局前置守卫 (Global BeforeEach Guard)
 * 这是实现路由保护和访问控制的核心。
 * [无需修改] 此守卫的设计非常出色，可以自动处理我们新添加的 /tools/password-generator 路由。
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. 等待认证状态初始化完成
  if (authStore.loading) {
    await new Promise((resolve) => {
      const unsubscribe = authStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  // 2. 获取目标路由的认证要求和当前用户的登录状态
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isAuthenticated = !!authStore.user

  // 3. 根据认证状态进行访问控制
  if (requiresAuth && !isAuthenticated) {
    // A. 如果目标路由需要认证，但用户未登录
    console.log(`访问被拒绝：路径 '${to.path}' 需要认证。正在重定向...`)

    // 动态导入 Toast store 以显示提示信息
    // 注意：这里的路径是根据您提供的代码推断的，请确保路径正确
    const { useToastStore } = await import('@/stores/toast')
    const toastStore = useToastStore()
    toastStore.showToast({ msg: '该页面需要登录后才能访问', toastType: 'info' })

    next({ name: 'shop' })
  } else if (to.name === 'update-password' && !isAuthenticated) {
    // B. 特殊情况：允许未登录用户访问密码重置页面
    next()
  } else {
    // C. 对于所有其他情况，正常放行
    next()
  }
})

export default router
