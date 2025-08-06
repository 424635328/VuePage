// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/details/:id',
      name: 'product-details',
      component: () => import('../views/ProductDetailsPage.vue'),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopPage.vue'),
      meta: { requiresAuth: true }, // 标记此路由需要登录
    },
  ],
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 等待 Pinia store 的认证状态加载完成
  if (authStore.loading) {
    await new Promise(resolve => {
        const unsubscribe = authStore.$subscribe((mutation, state) => {
            if (!state.loading) {
                unsubscribe();
                resolve();
            }
        });
    });
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = !!authStore.user

  if (requiresAuth && !isAuthenticated) {
    // 如果需要登录但用户未登录，可以重定向到首页或显示登录提示
    // 在本例中，我们让页面组件自己处理UI，只阻止导航
    console.log('Access denied. User not authenticated.');
    // 如果希望重定向，使用 next({ name: 'home' })
    // 这里我们允许进入页面，让页面组件处理未登录状态
    next()
  } else {
    next()
  }
})

export default router
