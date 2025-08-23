<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>编辑密码信息</h3>
          <button @click="$emit('close')" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="platform">平台</label>
              <input id="platform" v-model="editableItem.platform" type="text" required>
            </div>
            <div class="form-group">
              <label for="label">标签/用户名 (选填)</label>
              <input id="label" v-model="editableItem.label" type="text">
            </div>
            <div class="form-group">
              <label for="notes">备注 (选填)</label>
              <textarea id="notes" v-model="editableItem.notes" rows="4"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="$emit('close')" class="btn btn-secondary">取消</button>
          <button @click="handleSubmit" class="btn btn-primary">保存更改</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  item: Object,
});

const emit = defineEmits(['close', 'save']);

const editableItem = ref({});

watch(() => props.item, (newItem) => {
  // 当 item prop 变化时，深度克隆一份用于编辑，防止直接修改 prop
  editableItem.value = JSON.parse(JSON.stringify(newItem || {}));
}, { immediate: true });

function handleSubmit() {
  // 只提交需要更改的字段
  const updates = {
    platform: editableItem.value.platform,
    label: editableItem.value.label,
    notes: editableItem.value.notes,
  };
  emit('save', updates);
  emit('close');
}
</script>

<style lang="scss" scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background: #1e293b; /* --bg-secondary */
  color: #f1f5f9; /* --text-primary */
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1); /* --border-light */
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { margin: 0; font-size: 1.25rem; }
  .close-btn {
    background: none; border: none; font-size: 2rem;
    color: #94a3b8; /* --text-secondary */
    cursor: pointer;
    line-height: 1;
    padding: 0;
    &:hover { color: #f1f5f9; }
  }
}
.modal-body {
  padding: 1.5rem;
  .form-group {
    margin-bottom: 1.25rem;
    label { display: block; margin-bottom: 0.5rem; color: #94a3b8; }
    input, textarea {
      width: 100%;
      background: #0f172a; /* --bg-primary */
      border: 1px solid rgba(148, 163, 184, 0.2); /* --border-medium */
      color: #f1f5f9;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      &:focus {
        outline: none;
        border-color: #3b82f6; /* --primary */
      }
    }
    textarea { resize: vertical; }
  }
}
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  .btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary {
    background: #334155;
    color: #f1f5f9;
    &:hover { background: #475569; }
  }
  .btn-primary {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }
}
</style>
