// src/composables/useRedirect.js

import { useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui';

export function useRedirect() {
  const router = useRouter();
  const uiStore = useUiStore();

  /**
   * 执行一个带有全局加载和成功提示的路由跳转
   * @param {import('vue-router').RouteLocationRaw} to - 路由目标，同 router.push 的参数
   * @param {object} options - 可选配置
   * @param {string} options.loadingMessage - 加载时显示的提示
   * @param {string} options.successMessage - 成功后显示的提示
   * @param {string} options.errorMessage - 失败后显示的提示
   */
  async function redirectWithTip(to, options = {}) {
    const {
      loadingMessage = '正在跳转，请稍候...',
      successMessage = '跳转成功！',
      errorMessage = '跳转失败，请检查网络或权限。'
    } = options;

    // 1. 开始跳转，显示加载提示
    uiStore.startRedirect(loadingMessage);

    try {
      // 2. 执行路由跳转，并等待结果
      // router.push 返回一个 Promise，会在导航成功或失败后 resolve/reject
      await router.push(to);

      // 3. 导航成功
      uiStore.endRedirectSuccess(successMessage);

    } catch (error) {
      // 4. 导航失败 (例如被导航守卫中断)
      console.error('Navigation failed:', error);
      uiStore.endRedirectError(errorMessage);
    }
  }

  return {
    redirectWithTip,
  };
}
