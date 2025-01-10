<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Skills Hub</h3>
          <p>Learn and master new skills</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <router-link to="/chess">Chess Lessons</router-link>
          <router-link to="/singing">Singing Lessons</router-link>
          <router-link to="/progress">Track Progress</router-link>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 Skills Hub. Made with ❤️</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--secondary-color);
  color: white;
  padding: var(--spacing-xl) 0 var(--spacing-md);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.footer-section h3 {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.footer-section h4 {
  color: var(--accent-color);
  margin-bottom: var(--spacing-sm);
}

.footer-section a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
  margin-bottom: var(--spacing-sm);
}

.footer-section a:hover {
  color: var(--primary-color);
}

.footer-bottom {
  padding-top: var(--spacing-md);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>