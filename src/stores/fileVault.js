// src/stores/fileVault.js

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/composables/useToast'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// --- 全局常量定义 ---
// 将配置项定义为常量，使得代码更清晰且易于维护。
const FILES_PER_PAGE = 15;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const BUCKET_NAME = 'user-files'; // 使用符合 Supabase 规范的桶名称

/**
 * @typedef {object} FileData
 * @property {string} id
 * @property {string} created_at
 * @property {string} user_id
 * @property {string} file_name
 * @property {string} file_path
 * @property {string} mime_type
 * @property {number} size_bytes
 * @property {string | null} description
 */

export const useFileVaultStore = defineStore('fileVault', () => {
  // --- 初始化组合式函数 ---
  const { addToast } = useToast();

  // --- State ---
  /** @type {import('vue').Ref<FileData[]>} */
  const files = ref([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const uploadingFiles = ref([]); // 用于跟踪正在上传的文件 { id, name, progress }
  /** @type {import('vue').Ref<Set<string>>} */
  const selectedFiles = ref(new Set());

  // --- Actions ---

  /**
   * 获取初始的文件列表（第一页）。
   */
  async function fetchInitialFiles() {
    if (loading.value) return;
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(FILES_PER_PAGE);

      if (error) throw error;

      files.value = data;
      hasMore.value = data.length === FILES_PER_PAGE;
    } catch (error) {
      addToast({ message: `Error fetching files: ${error.message}`, type: 'error' });
      console.error('Error fetching initial files:', error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取更多的文件（用于无限滚动）。
   */
  async function fetchMoreFiles() {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })
        .range(files.value.length, files.value.length + FILES_PER_PAGE - 1);

      if (error) throw error;

      files.value.push(...data);
      hasMore.value = data.length === FILES_PER_PAGE;
    } catch (error) {
      addToast({ message: `Error fetching more files: ${error.message}`, type: 'error' });
      console.error('Error fetching more files:', error);
    } finally {
      loadingMore.value = false;
    }
  }

  /**
   * 上传单个文件。
   * @param {File} fileToUpload - 用户选择的 File 对象。
   */
  async function uploadFile(fileToUpload) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      addToast({ message: 'Authentication error. Please log in again.', type: 'error' });
      return;
    }
    const user = session.user;

    if (fileToUpload.size > MAX_FILE_SIZE_BYTES) {
      addToast({ message: `File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`, type: 'error' });
      return;
    }

    const fileExt = fileToUpload.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${uniqueFileName}`;

    const uploadId = uuidv4();
    uploadingFiles.value.push({ id: uploadId, name: fileToUpload.name, progress: 0 });

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
             const currentUpload = uploadingFiles.value.find(f => f.id === uploadId);
             if (currentUpload) {
               currentUpload.progress = Math.round((progress.loaded / progress.total) * 100);
             }
          }
        });

      if (uploadError) throw uploadError;

      const newFileMetadata = {
        user_id: user.id,
        file_name: fileToUpload.name,
        file_path: filePath,
        mime_type: fileToUpload.type,
        size_bytes: fileToUpload.size,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert(newFileMetadata)
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      addToast({ message: `Successfully uploaded ${fileToUpload.name}`, type: 'success' });
      files.value.unshift(dbData);

    } catch (error) {
      addToast({ message: `Upload failed: ${error.message}`, type: 'error' });
      console.error('Upload process failed:', error);
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(f => f.id !== uploadId);
    }
  }

  /**
   * 更新文件的备注。
   * @param {string} fileId - 文件的 ID。
   * @param {string} description - 新的备注内容。
   */
  async function updateFileDescription(fileId, description) {
    try {
      const { error } = await supabase
        .from('files')
        .update({ description })
        .eq('id', fileId);

      if (error) throw error;

      const file = files.value.find(f => f.id === fileId);
      if (file) {
        file.description = description;
      }
      addToast({ message: 'Description updated.', type: 'success', duration: 1500 });
    } catch (error) {
      addToast({ message: `Failed to update description: ${error.message}`, type: 'error' });
    }
  }

  /**
   * 下载单个文件。
   * @param {FileData} file - 要下载的文件对象。
   */
  async function downloadSingleFile(file) {
    try {
      addToast({ message: `Preparing '${file.file_name}' for download...`, type: 'info' });
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;

      saveAs(data.signedUrl, file.file_name);
    } catch (error) {
      addToast({ message: `Download failed: ${error.message}`, type: 'error' });
    }
  }

  /**
   * 批量下载选中的文件。
   */
  async function downloadSelectedFiles() {
    if (selectedFiles.value.size === 0) return;

    addToast({ message: 'Preparing ZIP file... Please wait.', type: 'info' });
    const zip = new JSZip();
    const filesToDownload = files.value.filter(f => selectedFiles.value.has(f.id));

    try {
      const signedUrlPromises = filesToDownload.map(file =>
        supabase.storage.from(BUCKET_NAME).createSignedUrl(file.file_path, 300)
      );
      const signedUrlResults = await Promise.all(signedUrlPromises);

      const downloadPromises = signedUrlResults.map((result, index) => {
        if (result.error) {
          console.error(`Failed to get signed URL for ${filesToDownload[index].file_name}`, result.error);
          return Promise.resolve(null);
        }
        return fetch(result.data.signedUrl)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.blob();
          })
          .then(blob => ({ blob, file: filesToDownload[index] }))
          .catch(err => {
            console.error(`Failed to download ${filesToDownload[index].file_name}`, err);
            addToast({message: `Could not download ${filesToDownload[index].file_name}`, type: 'error'});
            return null;
          });
      });

      const downloadedContents = await Promise.all(downloadPromises);

      let fileCount = 0;
      downloadedContents.forEach(content => {
        if (content) {
          zip.file(content.file.file_name, content.blob);
          fileCount++;
        }
      });

      if (fileCount === 0) {
        throw new Error('All selected files failed to download.');
      }

      addToast({ message: 'Zipping files...', type: 'info' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `vault-download-${new Date().toISOString().slice(0,10)}.zip`);

      selectedFiles.value.clear();

    } catch (error) {
      addToast({ message: `Failed to create ZIP: ${error.message}`, type: 'error' });
    }
  }

  /**
   * 删除一个文件。
   * @param {FileData} file - 要删除的文件对象。
   */
  async function deleteFile(file) {
    try {
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([file.file_path]);

      if (storageError) throw storageError;

      files.value = files.value.filter(f => f.id !== file.id);
      selectedFiles.value.delete(file.id); // Also remove from selection
      addToast({ message: `File '${file.file_name}' deleted successfully.`, type: 'success' });
    } catch(error) {
      addToast({ message: `Failed to delete file: ${error.message}`, type: 'error' });
    }
  }

  // --- 返回 Store 的公共 API ---
  return {
    files,
    loading,
    loadingMore,
    hasMore,
    uploadingFiles,
    selectedFiles,
    fetchInitialFiles,
    fetchMoreFiles,
    uploadFile,
    updateFileDescription,
    downloadSingleFile,
    downloadSelectedFiles,
    deleteFile,
  };
});
