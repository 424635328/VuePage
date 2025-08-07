<template>
  <div class="skeleton-container">
    <div class="details-layout">
      <aside class="gallery-column">
        <div class="skeleton main-image"></div>
        <div class="thumbnail-grid">
          <div class="skeleton thumbnail-image"></div>
          <div class="skeleton thumbnail-image"></div>
          <div class="skeleton thumbnail-image"></div>
        </div>
      </aside>
      <article class="content-column">
        <div class="skeleton title-line"></div>
        <div class="skeleton meta-line"></div>
        <div class="skeleton content-line"></div>
        <div class="skeleton content-line short"></div>
        <div class="skeleton content-line medium"></div>
      </article>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: #2c2c2c;
  background-image: linear-gradient(to right, #2c2c2c 0%, #3a3a3a 20%, #2c2c2c 40%, #2c2c2c 100%);
  background-repeat: no-repeat;
  background-size: 2000px 100%;
  animation: shimmer 2s linear infinite;
  border-radius: 8px;
}

.details-layout {
  display: flex;
  gap: 3rem;
}
.gallery-column { flex: 0 0 40%; max-width: 500px; }
.main-image { width: 100%; aspect-ratio: 4 / 3; margin-bottom: 1rem; }
.thumbnail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 0.75rem; }
.thumbnail-image { width: 100%; aspect-ratio: 1 / 1; }

.content-column { flex: 1; min-width: 0; }
.title-line { height: 3rem; width: 80%; margin-bottom: 1.5rem; }
.meta-line { height: 3.5rem; width: 60%; margin-bottom: 3rem; }
.content-line { height: 1.25rem; width: 100%; margin-bottom: 1rem; }
.short { width: 60%; }
.medium { width: 80%; }

@media (max-width: 992px) {
  .details-layout { flex-direction: column; }
  .gallery-column { width: 100%; max-width: 100%; }
}
</style>
