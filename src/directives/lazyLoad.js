// src/directives/lazyLoad.js

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1 // 元素 10% 可见时触发
};

// 使用 WeakMap 来存储每个元素的 observer，以便在 unbind 时能正确清理
const observers = new WeakMap();

function loadImage(el, binding) {
  // 如果 src 已经是真实 URL，则不处理 (例如，已经加载过)
  if (el.src === binding.value) {
    return;
  }

  el.src = '/placeholder.svg'; // 先显示占位图

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 元素进入视口，加载真实图片
        const lazyImage = entry.target;
        lazyImage.src = binding.value; // 从 v-lazy-load="REAL_IMAGE_URL" 获取 URL

        // 图像加载成功后，移除 data-src
        lazyImage.onload = () => {
          lazyImage.removeAttribute('data-src');
        };
        // 图像加载失败，保持占位图
        lazyImage.onerror = () => {
            console.warn(`Failed to load lazy image: ${binding.value}`);
            lazyImage.src = '/placeholder.svg'; // 确保显示占位图
        };

        // 加载后停止观察
        self.unobserve(lazyImage);
        observers.delete(el); // 清理 map
      }
    });
  }, observerOptions);

  observers.set(el, observer);
  observer.observe(el);
}

const lazyLoadDirective = {
  mounted(el, binding) {
    loadImage(el, binding);
  },
  updated(el, binding) {
    // 如果 URL 变化了，重新观察
    if (binding.oldValue !== binding.value) {
      const oldObserver = observers.get(el);
      if (oldObserver) {
        oldObserver.disconnect();
        observers.delete(el);
      }
      loadImage(el, binding);
    }
  },
  beforeUnmount(el) {
    // 组件卸载前，清理 observer
    const observer = observers.get(el);
    if (observer) {
      observer.disconnect();
      observers.delete(el);
    }
  }
};

export default lazyLoadDirective;
