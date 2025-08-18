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
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpPage.vue'),
      meta: { requiresAuth: false }, // 这是一个公开页面
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyPage.vue'),
      meta: { requiresAuth: false }, // 公开页面
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/TermsPage.vue'),
      meta: { requiresAuth: false }, // 公开页面
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('../views/DocsPage.vue'),
      meta: { requiresAuth: false }, // 这是一个公开页面
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsPage.vue'),
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopPage.vue'),
      meta: { requiresAuth: false }, // 公开页面，无需认证
    },
    {
      path: '/shop/new',
      name: 'product-new',
      component: () => import('../views/ProductEditPage.vue'),
      meta: { requiresAuth: true }, // 需要认证
    },
    {
      path: '/shop/edit/:public_id',
      name: 'product-edit',
      component: () => import('../views/ProductEditPage.vue'),
      meta: { requiresAuth: true }, // 需要认证
      props: true,
    },
    {
      path: '/details/:public_id',
      name: 'product-details',
      component: () => import('../views/ProductDetailsPage.vue'),
      props: true,
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/PasswordResetPage.vue'),
      meta: {
        title: 'Reset Password',
      },
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
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/ImageEditorPage.vue'),
      meta: { requiresAuth: true }, // 需要认证
    },
    // --- 新增文件保险库路由 ---
    {
      path: '/vault',
      name: 'file-vault',
      // 同样使用懒加载，优化初始加载性能
      component: () => import('../views/FileVaultPage.vue'),
      // 这是关键：将此路由标记为需要认证。
      // 现有的 beforeEach 守卫会自动处理访问控制。
      meta: { requiresAuth: true },
    },
    {
      path: '/cdk-management',
      name: 'cdk-management',
      component: () => import('../views/CdkPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('../views/NotFoundPage.vue'),
    },
    // --- 捕获所有未匹配路由，必须放在最后 ---
    {
      path: '/:catchAll(.*)*',
      redirect: { name: 'NotFound' },
    },
  ],
})

/**
 * 全局前置守卫 (Global BeforeEach Guard)
 * 这是实现路由保护和访问控制的核心。
 * 在每次路由跳转之前，这个函数都会被执行。
 * [无需修改] 此守卫的设计非常出色，可以自动处理我们新添加的 /vault 路由。
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. 等待认证状态初始化完成
  // 这是一个非常重要的步骤，确保在检查用户登录状态前，
  // authStore 已经完成了从本地存储或 Supabase 恢复会话的异步操作。
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
    const { useToastStore } = await import('@/stores/toast')
    const toastStore = useToastStore()
    toastStore.showToast({ msg: '该页面需要登录后才能访问', toastType: 'info' })

    // 将用户重定向到商店主页。在主页上，用户可以通过导航栏打开登录模态框。
    // 注意：您之前的代码重定向到 'shop'，我将保持这个逻辑。
    // 如果您有专门的登录页，可以改为 next({ name: 'Login' })。
    next({ name: 'shop' })
  } else if (to.name === 'update-password' && !isAuthenticated) {
    // B. 特殊情况：允许未登录用户访问密码重置页面
    // 这是因为用户通过邮件链接访问时，有效的会话信息存在于URL的#片段中。
    // App.vue 中的 onAuthStateChange 监听器会处理这个会话并自动登录用户。
    // 因此，我们必须放行，让 App.vue 的逻辑能够执行。
    next()
  } else {
    // C. 对于所有其他情况（已登录用户访问任意页面，或未登录用户访问公共页面），
    // 正常放行。
    next()
  }
})

export default router
