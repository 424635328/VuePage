/**
 * Web Worker for handling data import tasks.
 * It reads file content, parses JSON/CSV, and decrypts data in the background,
 * preventing the main UI thread from freezing.
 */

// 导入解密工具函数
import { decryptData } from '@/utils/crypto';

// 监听来自主线程的消息
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'IMPORT_DATA') {
    const { fileContent, fileName, decryptionKey } = payload;

    try {
      let itemsToImport = [];
      const fileType = fileName.endsWith('.json') ? 'json' : (fileName.endsWith('.csv') ? 'csv' : 'unknown');

      self.postMessage({ status: 'progress', payload: '正在解析数据...' });

      if (fileType === 'json') {
        let data;
        try {
          data = JSON.parse(fileContent);
        } catch (e) {
          console.error("JSON 解析失败。", e);
          throw new Error("无效的 JSON 文件，无法解析。");
        }

        if (data.encryptedData) { // 加密文件格式
          if (!decryptionKey) {
            throw new Error("这是一个加密文件，请输入解密密码。");
          }
          self.postMessage({ status: 'progress', payload: '正在解密文件...' });
          // 这是最耗时的操作
          const decryptedString = await decryptData(data.encryptedData, decryptionKey);
          try {
             itemsToImport = JSON.parse(decryptedString);
          } catch(error) {
            console.error("解密后的数据不是有效的 JSON。", error);
             throw new Error("解密失败，密码错误或文件已损坏。");
          }
        } else { // 明文 JSON
          itemsToImport = data;
        }

      } else if (fileType === 'csv') {
        // 简单 CSV 解析 (platform,label,password,notes)
        // 跳过表头
        const lines = fileContent.split(/\r?\n/).slice(1);
        itemsToImport = lines.filter(line => line.trim() !== '').map(line => {
          // 简易的CSV解析，可能需要更健壮的库来处理带引号的逗号等情况
          const [platform, label, password, notes] = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
          return { platform, label, password, notes };
        });

      } else {
        throw new Error("不支持的文件类型。请选择 .json 或 .csv 文件。");
      }

      // 在 Worker 中进行数据校验
      if (!Array.isArray(itemsToImport) || itemsToImport.some(i => !i || !i.platform || !i.password)) {
        throw new Error("文件格式不正确或缺少必要的字段 (platform, password)。");
      }

      // 任务成功，将解析和解密后的数据数组发送回主线程
      self.postMessage({
        status: 'success',
        payload: itemsToImport, // 发送纯净的数据数组
      });

    } catch (error) {
      // 任务失败，将错误信息发送回主线程
      self.postMessage({
        status: 'error',
        payload: error.message,
      });
    }
  }
};
