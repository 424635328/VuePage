<!-- src/components/password/ArchiveManager.vue -->

<template>
  <div class="archive-manager-container">
    <div class="archive-header">
      <h2>密码存档</h2>
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="store.searchQuery"
          placeholder="按平台或标签搜索..."
          class="search-input"
        />
      </div>
    </div>
    <div class="archive-list-wrapper">
      <div v-if="store.isLoading" class="state-message">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div v-else-if="store.archive.length === 0" class="state-message empty-archive">
        <div class="empty-icon-wrapper">
          <i class="fas fa-box-open"></i>
        </div>
        <h3>存档为空</h3>
        <p>您保存的密码将会显示在这里。</p>
      </div>
       <div v-else-if="store.filteredArchive.length === 0" class="state-message">
        <i class="fas fa-search"></i>
        <p>未找到匹配项。</p>
      </div>
      <transition-group name="list" tag="div" class="archive-list" v-else>
        <ArchiveItem
          v-for="item in store.filteredArchive"
          :key="item.id"
          :item="item"
        />
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { usePasswordStore } from '@/stores/password'
import ArchiveItem from './ArchiveItem.vue'
const store = usePasswordStore()
</script>

<style lang="scss" scoped>
.archive-manager-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.archive-header {
  flex-shrink: 0;
  h2 {
    margin: 0 0 1.5rem 0;
    color: #fff;
    font-size: 1.75rem;
    font-weight: 600;
  }
}

.search-wrapper {
  position: relative;
  .search-icon {
    position: absolute; left: 1.25rem; top: 50%;
    transform: translateY(-50%); color: #5C5B77;
    transition: color 0.2s;
  }
  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3.5rem;
    background: #2E2D3D;
    border: 1px solid #313042;
    color: #C7C7E1;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    &::placeholder { color: #5C5B77; }
    &:focus {
      outline: none; border-color: #29D47A; background-color: #232230;
      & + .search-icon { color: #29D47A; }
    }
  }
}

.archive-list-wrapper {
  flex-grow: 1;
  overflow: hidden;
  margin-top: 1.5rem;
}

.archive-list {
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.state-message {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; text-align: center;
  color: #5C5B77;

  i { font-size: 1.5rem; }

  &.empty-archive {
    .empty-icon-wrapper {
      width: 120px; height: 120px;
      border-radius: 50%;
      background-color: #2E2D3D;
      display: grid; place-items: center;
      margin-bottom: 2rem;
      border: 1px solid #313042;
      i { font-size: 3rem; color: #5C5B77; }
    }
    h3 { margin: 0 0 0.5rem 0; color: #C7C7E1; font-size: 1.1rem; font-weight: 500; }
    p { margin: 0; }
  }
}

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }
</style>
