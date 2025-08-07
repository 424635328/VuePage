// src/composables/useImageProcessor.js

import { ref } from 'vue';
import imageCompression from 'browser-image-compression';
import { useToastStore } from '@/stores/toast';

export function useImageProcessor() {
  const toastStore = useToastStore();
  const processing = ref(false);

  // 这个函数将处理文件，压缩它们，并返回一个包含预览URL和文件对象的数组
  const processFiles = async (files) => {
    if (files.length === 0) return [];

    processing.value = true;
    toastStore.showToast({ msg: `正在处理 ${files.length} 张图片...`, toastType: 'info' });

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    // ✨ 1. 使用 Promise.allSettled 来处理所有文件，即使其中一些失败
    const compressionPromises = files
      .filter(file => file.type.startsWith('image/')) // 仅处理图片文件
      .map(async (file) => {
        const compressedFile = await imageCompression(file, options);
        const previewUrl = URL.createObjectURL(compressedFile);
        return {
          file: compressedFile,
          previewUrl: previewUrl,
          id: `new_${Date.now()}_${Math.random()}`
        };
      });

    const results = await Promise.allSettled(compressionPromises);

    const processedImages = [];
    let failedCount = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        processedImages.push(result.value);
      } else {
        failedCount++;
        console.error('单个图片压缩失败:', result.reason);
      }
    });

    // ✨ 2. 提供更精确的用户反馈
    let finalMessage = `处理完成！成功 ${processedImages.length} 张。`;
    if (failedCount > 0) {
      finalMessage += ` 失败 ${failedCount} 张。`;
    }
    toastStore.showToast({
      msg: finalMessage,
      toastType: failedCount > 0 ? 'error' : 'success'
    });

    processing.value = false;
    return processedImages;
  };

  /**
   * 清理由 URL.createObjectURL 创建的本地URL，防止内存泄漏。
   * @param {Array<object>} images - 来自组件状态的图片数组。
   *   每个对象应包含一个 `image_url` 属性。
   */
  const revokeImageUrls = (images) => {
      images.forEach(img => {
          // ✨ 3. FIX: 检查 `img.image_url` 而不是 `img.previewUrl`
          // 因为组件将 previewUrl 赋值给了 image_url
          if (img && img.image_url && img.image_url.startsWith('blob:')) {
              URL.revokeObjectURL(img.image_url);
          }
      });
  };

  return {
    processing,
    processFiles,
    revokeImageUrls,
  };
}
