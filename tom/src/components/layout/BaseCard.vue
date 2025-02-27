<template>
  <div class="card">
    <div class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <h3 class="card-title">
        <slot name="title"></slot>
      </h3>
      <p class="card-content">
        <slot name="content"></slot>
      </p>
    </div>
    <div class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template> 
<style scoped>
.card {
  background: white; 
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-header img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text);
}

.card-content {
  color: var(--text-light);
  margin-bottom: 1.5rem;
}

.card-footer {
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid var(--border);
}
</style>