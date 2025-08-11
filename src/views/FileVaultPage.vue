<!-- src/views/FileVaultPage.vue -->

<template>
  <div class="file-vault-page">
    <header class="vault-header">
      <h1>My File Vault</h1>
      <p>Securely store and manage your private files.</p>
    </header>

    <!-- Upload Zone -->
    <div
      class="upload-zone"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      :class="{ 'drag-over': isDragging }"
    >
      <input type="file" ref="fileInput" @change="onFileSelect" multiple hidden />
      <div class="upload-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <p>Drag & drop files here, or</p>
        <button @click="triggerFileInput" class="btn-primary">Browse Files</button>
        <p class="upload-hint">Max file size: 50MB per file.</p>
      </div>
    </div>

    <!-- Uploading Files Progress -->
    <div v-if="uploadingFiles.length > 0" class="upload-progress-container">
      <h3>Uploading...</h3>
      <div v-for="file in uploadingFiles" :key="file.id" class="upload-item">
        <span class="file-name">{{ file.name }}</span>
        <div class="progress-bar">
          <div class="progress" :style="{ width: file.progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ file.progress }}%</span>
      </div>
    </div>

    <!-- 新增: 批量操作栏 -->
    <transition name="action-bar-fade">
      <div v-if="selectedFiles.size > 0" class="action-bar">
        <span class="selection-count">{{ selectedFiles.size }} file(s) selected</span>
        <div class="action-buttons">
          <button @click="downloadSelectedFiles" class="btn-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
            Download as .zip
          </button>
          <button @click="confirmDeleteSelected" class="btn-action btn-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            Delete
          </button>
        </div>
        <button @click="clearSelection" class="btn-clear-selection" title="Clear selection">&times;</button>
      </div>
    </transition>

    <!-- File List -->
    <div class="file-list-container">
      <div class="list-header">
        <h2>Your Files</h2>
        <div class="select-all-container" v-if="files.length > 0">
            <input type="checkbox" id="select-all" @change="toggleSelectAll" :checked="isAllSelected" />
            <label for="select-all">Select All</label>
        </div>
      </div>
      <div v-if="loading" class="loading-spinner">Loading files...</div>
      <div v-else-if="files.length === 0" class="empty-state">
        <p>Your vault is empty. Upload your first file!</p>
      </div>
      <div v-else class="file-grid">
        <div
          v-for="file in files"
          :key="file.id"
          class="file-card"
          :class="{ 'is-selected': selectedFiles.has(file.id) }"
          @click.self="toggleSelection(file.id)"
        >
          <div class="card-header" @click.self="toggleSelection(file.id)">
            <input
              type="checkbox"
              :checked="selectedFiles.has(file.id)"
              @change.stop="toggleSelection(file.id)"
              class="selection-checkbox"
            />
            <div class="file-icon">{{ getFileExtension(file.file_name) }}</div>
            <div class="file-info">
              <span class="file-name" :title="file.file_name">{{ file.file_name }}</span>
              <span class="file-meta">{{ formatBytes(file.size_bytes) }} - {{ new Date(file.created_at).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="description-section">
            <textarea
              :value="file.description"
              @input="onDescriptionInput(file.id, $event.target.value)"
              placeholder="Add a description..."
              class="description-textarea"
              rows="2"
              @click.stop
            ></textarea>
          </div>

          <div class="card-footer">
            <button @click.stop="downloadSingleFile(file)" class="btn-card-action" title="Download file">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
            </button>
            <button @click.stop="confirmDelete(file)" class="btn-card-action btn-danger" title="Delete file">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div ref="observerEl" class="observer">
         <span v-if="loadingMore">Loading more files...</span>
         <span v-if="!hasMore && files.length > 0">No more files.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileVaultStore } from '@/stores/fileVault'
import { useIntersectionObserver, useDebounceFn } from '@vueuse/core'
import { useConfirm } from '@/composables/useConfirm'

const fileVaultStore = useFileVaultStore()
const {
  files, loading, loadingMore, hasMore, uploadingFiles, selectedFiles
} = storeToRefs(fileVaultStore)
const {
  fetchInitialFiles, fetchMoreFiles, uploadFile, deleteFile,
  updateFileDescription, downloadSingleFile, downloadSelectedFiles
} = fileVaultStore
const { showConfirm } = useConfirm()

const fileInput = ref(null)
const isDragging = ref(false)
const observerEl = ref(null)

onMounted(() => {
  fetchInitialFiles()
})

useIntersectionObserver(observerEl, ([{ isIntersecting }]) => {
  if (isIntersecting && hasMore.value && !loading.value) {
    fetchMoreFiles()
  }
})

// Drag and drop handlers
const onDragOver = () => { isDragging.value = true }
const onDragLeave = () => { isDragging.value = false }
const onDrop = (e) => {
  isDragging.value = false
  handleFiles(e.dataTransfer.files)
}

// File input handlers
const triggerFileInput = () => { fileInput.value.click() }
const onFileSelect = (e) => {
  handleFiles(e.target.files)
  e.target.value = null
}

const handleFiles = (fileList) => {
  if (!fileList.length) return
  for (const file of fileList) {
    uploadFile(file)
  }
}

// Selection logic
const toggleSelection = (fileId) => {
  if (selectedFiles.value.has(fileId)) {
    selectedFiles.value.delete(fileId)
  } else {
    selectedFiles.value.add(fileId)
  }
}

const clearSelection = () => {
  selectedFiles.value.clear()
}

const isAllSelected = computed(() => {
    return files.value.length > 0 && files.value.every(f => selectedFiles.value.has(f.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        clearSelection()
    } else {
        files.value.forEach(f => selectedFiles.value.add(f.id))
    }
}


// Description update logic
const onDescriptionInput = useDebounceFn((fileId, value) => {
  updateFileDescription(fileId, value)
}, 750)

// Deletion logic
const confirmDelete = async (file) => {
  const isConfirmed = await showConfirm({
    title: 'Confirm Deletion',
    message: `Are you sure you want to permanently delete '${file.file_name}'?`,
    confirmText: 'Delete'
  })
  if (isConfirmed) {
    deleteFile(file)
    selectedFiles.value.delete(file.id) // Also remove from selection
  }
}

const confirmDeleteSelected = async () => {
  const count = selectedFiles.value.size;
  const isConfirmed = await showConfirm({
    title: `Delete ${count} Files`,
    message: `Are you sure you want to permanently delete all ${count} selected files? This action cannot be undone.`,
    confirmText: 'Delete All',
    cancelText: 'Cancel'
  })
  if (isConfirmed) {
    const filesToDelete = files.value.filter(f => selectedFiles.value.has(f.id));
    await Promise.all(filesToDelete.map(file => deleteFile(file)))
    clearSelection()
  }
}

// Helper functions
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toUpperCase() || '??'
}
</script>

<style scoped lang="scss">
/* Adopting a style that fits your cyberpunk/modern aesthetic */
.file-vault-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #e0e0e0;
}

.vault-header {
  text-align: center;
  margin-bottom: 2rem;
  h1 { font-size: 2.5rem; font-weight: 700; color: #42b883; }
  p { font-size: 1.1rem; color: #a0a0a0; }
}

.upload-zone {
  border: 2px dashed #444; border-radius: 8px; padding: 3rem;
  text-align: center; cursor: pointer; transition: all 0.3s ease;
  background-color: rgba(30, 30, 30, 0.5);
  margin-bottom: 2rem;

  &.drag-over { border-color: #42b883; background-color: rgba(66, 184, 131, 0.1); }
  svg { margin-bottom: 1rem; color: #777; transition: color 0.3s ease; }
  &:hover svg { color: #42b883; }
  .upload-hint { font-size: 0.9rem; color: #777; margin-top: 1rem; }
}
.btn-primary {
  background-color: #42b883; color: white; border: none; padding: 0.8rem 1.5rem;
  border-radius: 5px; cursor: pointer; transition: background-color 0.3s;
  &:hover { background-color: #3aa071; }
}

.upload-progress-container {
  margin: 2rem 0; padding: 1rem; background: rgba(30, 30, 30, 0.8);
  border-radius: 8px; h3 { margin-bottom: 1rem; }
  .upload-item {
    display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;
    .file-name { flex-shrink: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .progress-bar {
      flex-grow: 1; height: 10px; background: #444; border-radius: 5px; overflow: hidden;
      .progress { height: 100%; background: #42b883; transition: width 0.2s linear; }
    }
    .progress-text { font-variant-numeric: tabular-nums; }
  }
}

.action-bar {
  position: sticky; top: 1rem; z-index: 10; display: flex; align-items: center;
  justify-content: space-between; padding: 1rem 1.5rem;
  background-color: rgba(66, 184, 131, 0.9); color: white; border-radius: 8px;
  margin-bottom: 2rem; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}
.action-bar-fade-enter-active, .action-bar-fade-leave-active { transition: all 0.3s ease; }
.action-bar-fade-enter-from, .action-bar-fade-leave-to { opacity: 0; transform: translateY(-20px); }
.selection-count { font-weight: 600; }
.action-buttons { display: flex; align-items: center; gap: 1rem; }
.btn-action {
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5);
  color: white; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem; font-weight: 600;
  transition: background-color 0.2s;
  &.btn-danger { background: #c83232; }
  &:hover { background: rgba(255,255,255,0.3); }
  &.btn-danger:hover { background: #e53935; }
}
.btn-clear-selection {
  background: none; border: none; font-size: 1.5rem; line-height: 1;
  color: white; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;
  &:hover { opacity: 1; }
}

.file-list-container {
  margin-top: 3rem;
  .list-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #444; padding-bottom: 0.5rem; margin-bottom: 2rem;
  }
  .select-all-container {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;
      label { cursor: pointer; }
      input { cursor: pointer; }
  }
}
.file-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.file-card {
  background: rgba(40, 40, 40, 0.7); border: 1px solid #555; border-radius: 8px;
  display: flex; flex-direction: column; overflow: hidden;
  transition: all 0.2s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); }
  &.is-selected {
    border-color: #42b883;
    box-shadow: 0 0 0 2px #42b883, 0 5px 15px rgba(66, 184, 131, 0.4);
  }
}

.card-header {
  display: flex; align-items: center; padding: 1rem; gap: 1rem;
  cursor: pointer;
  .selection-checkbox {
    margin-right: -0.5rem; cursor: pointer; transform: scale(1.2);
    accent-color: #42b883;
  }
  .file-icon {
    flex-shrink: 0; width: 40px; height: 40px; background-color: #42b883;
    color: #111; display: grid; place-items: center; border-radius: 5px;
    font-weight: bold; font-size: 0.8rem;
  }
  .file-info {
    flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;
    .file-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-meta { font-size: 0.8rem; color: #aaa; }
  }
}

.description-section {
  padding: 0 1rem 1rem;
  .description-textarea {
    width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #555;
    border-radius: 4px; color: #e0e0e0; padding: 0.5rem; resize: vertical;
    font-family: inherit; font-size: 0.9rem;
    &:focus { outline: none; border-color: #42b883; background: #333;}
  }
}

.card-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem;
  border-top: 1px solid #444; background-color: rgba(0,0,0,0.2);
}

.btn-card-action {
  background: none; border: none; color: #999; cursor: pointer; padding: 0.5rem;
  border-radius: 50%; display: grid; place-items: center;
  transition: color 0.2s, background-color 0.2s;
  &:hover { color: #fff; background-color: rgba(255,255,255,0.1); }
  &.btn-danger:hover { color: #ff4d4d; background-color: rgba(255, 77, 77, 0.1); }
}

.observer {
  height: 50px; text-align: center; padding: 1rem; color: #888;
}
</style>
