// src/composables/useRedirect.js

import { useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui';

/**
 * 提供一个经过极致优化的、带全局UI提示的路由跳转函数。
 *
 * @returns {{ redirectWithTip: Function }}
 */
export function useRedirect() {
  const router = useRouter();
  const uiStore = useUiStore();

  /**
   * 执行一个带有全局加载和成功提示的智能路由跳转。
   *
   * 特性:
   * 1. **智能预判**: 如果目标与当前路由相同，则不执行任何操作。
   * 2. **延迟加载提示**: 仅当导航耗时超过 200ms 时才显示“加载中”，优化快速跳转的感知体验。
   * 3. **外部链接支持**: 自动识别并处理外部链接。
   *
   * @param {import('vue-router').RouteLocationRaw | string} to - 路由目标，同 router.push 的参数，或一个外部URL。
   * @param {object} options - 可选配置。
   * @param {string} options.loadingMessage - 加载时显示的提示。
   * @param {string} options.successMessage - 成功后显示的提示。
   * @param {string} options.errorMessage - 失败后显示的提示。
   */
  async function redirectWithTip(to, options = {}) {
    const {
      loadingMessage = '正在加载...', // 简化默认提示
      successMessage = '加载完成',
      errorMessage = '跳转失败，请重试'
    } = options;

    // --- 优化 1: 智能预判 ---

    // a) 处理外部链接
    if (typeof to === 'string' && to.startsWith('http')) {
      uiStore.startRedirect(loadingMessage);
      // 给予UIStore一点时间渲染，然后跳转
      setTimeout(() => { window.location.href = to; }, 50);
      return;
    }

    // b) 防止到当前页面的冗余跳转
    try {
      const targetRoute = router.resolve(to);
      if (targetRoute.fullPath === router.currentRoute.value.fullPath) {
        // console.log('Redirect aborted: already on the target page.');
        return; // 静默中止，不显示任何提示
      }
    } catch (e) {
      // 如果 to 是一个无效的路由对象，router.resolve 会报错
      console.error('Invalid route provided to redirectWithTip:', to, e);
      uiStore.endRedirectError('无效的路由目标');
      return;
    }

    // --- 优化 2: 延迟加载提示，优化感知速度 ---
    let loadingTimeout = null;

    // 设置一个定时器。如果导航在200ms内完成，此定时器会被清除，加载提示将永远不会显示。
    loadingTimeout = setTimeout(() => {
      uiStore.startRedirect(loadingMessage);
    }, 200); // 200ms是经过研究的用户感知延迟的黄金分割点

    try {
      // 执行路由跳转
      await router.push(to);

      // 导航成功
      uiStore.endRedirectSuccess(successMessage);

    } catch (error) {
      // 导航失败 (例如被导航守卫中断)
      // 我们需要检查错误是否是 NavigationFailure，以避免将非导航错误报告为导航失败
      // (在Vue Router 4中，合法的导航中止也会抛出错误)
      if (error.name && error.name.includes('NavigationFailure')) {
        // 这是预期的导航中止，例如在导航守卫中 return false。
        // 在这种情况下，我们通常不显示错误，而是静默地隐藏加载提示。
        uiStore.hideRedirect();
      } else {
        // 这是意外错误
        console.error('Navigation failed:', error);
        uiStore.endRedirectError(errorMessage);
      }
    } finally {
      // --- 优化 3: 健壮性 ---
      // 无论成功或失败，都必须清除定时器，防止在快速跳转后加载提示依然弹出
      clearTimeout(loadingTimeout);
    }
  }

  return {
    redirectWithTip,
  };
}
