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

    try {
      const processedImages = [];
      for (const file of files) {
        // 只处理图片文件
        if (!file.type.startsWith('image/')) continue;

        const compressedFile = await imageCompression(file, options);

        // 创建一个用于预览的本地 URL
        const previewUrl = URL.createObjectURL(compressedFile);

        processedImages.push({
          file: compressedFile, // 关联压缩后的 File 对象
          previewUrl: previewUrl,
          id: `new_${Date.now()}_${Math.random()}` // 生成一个临时的唯一ID
        });
      }
      toastStore.showToast({ msg: '图片处理完成！' });
      return processedImages;
    } catch (err) {
      console.error('Image processing failed:', err);
      toastStore.showToast({ msg: '图片处理失败，请重试', toastType: 'error' });
      return [];
    } finally {
      processing.value = false;
    }
  };

  // 清理创建的本地URL，防止内存泄漏
  const revokeImageUrls = (images) => {
      images.forEach(img => {
          if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(img.previewUrl);
          }
      });
  };

  return {
    processing,
    processFiles,
    revokeImageUrls,
  };
}
