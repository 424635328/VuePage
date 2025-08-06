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
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopPage.vue'),
      meta: { requiresAuth: true },
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
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactPage.vue'),
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
    // 对于受保护的路由，如果用户未登录，则允许进入页面，
    // 让页面组件自己（通过 v-if="!user"）来显示“访问受限”的提示。
    // 这种方式比强制重定向提供了更好的用户体验。
    console.log(`Access to '${to.path}' denied. User not authenticated. Letting page component handle UI.`);
    next()
  } else {
    next()
  }
})

export default router
