/**
 * Web Worker for handling data export tasks.
 * This script runs in a separate background thread,
 * preventing the main UI thread from freezing during heavy computations.
 */

// 假设你的加密函数位于 @/utils/crypto.js
// 注意：确保 crypto.js 是一个可以独立运行的模块，不依赖任何Vue或DOM的API。
import { encryptData } from '@/utils/crypto';

// 监听从主线程发送过来的消息
self.onmessage = async (event) => {
  // event.data 包含了主线程发送过来的数据
  const { type, payload } = event.data;

  if (type === 'EXPORT_DATA') {
    try {
      const { data, format, key } = payload;

      // --- 这里是原本阻塞主线程的全部逻辑 ---

      // 1. 准备要导出的数据 (移除 id)
      const dataToExport = data.map(item => {
        const newItem = { ...item };
        delete newItem.id;
        return newItem;
      });

      let fileContent;

      // 2. 根据格式进行序列化和加密
      if (format === 'plain') {
        fileContent = JSON.stringify(dataToExport, null, 2);
      } else { // Encrypted
        const jsonData = JSON.stringify(dataToExport);
        // 这是最耗时的操作
        const encrypted = await encryptData(jsonData, key);
        const exportObject = {
          encryptedData: encrypted,
          hint: 'This is an encrypted vault file.',
        };
        fileContent = JSON.stringify(exportObject);
      }

      // 3. 将处理完成的结果发送回主线程
      self.postMessage({
        status: 'success',
        payload: fileContent,
      });

    } catch (error) {
      // 如果在 Worker 中发生错误，将错误信息发送回主线程
      self.postMessage({
        status: 'error',
        payload: error.message || 'An unknown error occurred in the worker.',
      });
    }
  }
};
