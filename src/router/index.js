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
      // ✨ UPDATED: The meta field has been removed to make this route public.
      // meta: { requiresAuth: true },
      props: true,
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopPage.vue'),
      meta: { requiresAuth: true }, // This route remains protected.
    },
  ],
})

// 全局前置守卫 (No changes needed here)
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for the auth state to finish loading
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
    // For protected routes like /shop, this logic is still correct.
    // It will now correctly ignore /details/:id because it no longer has the meta field.
    console.log(`Access to '${to.path}' denied. User not authenticated. Letting page component handle UI.`);
    next()
  } else {
    next()
  }
})

export default router
