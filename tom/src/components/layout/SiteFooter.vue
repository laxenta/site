<template>
  <footer class="footer">
    <img
      src="https://i.pinimg.com/originals/6a/cd/07/6acd0780a4c693b2cf8da52b5c44b18e.gif"
      alt="Animated Chess GIF"
      class="footer-bg"
    />
    <div class="footer-overlay">
      <div class="footer-grid">
        <div class="footer-section">
          <h3>Skills Hub</h3>
          <p>Learn and master chess skills</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <router-link to="/chess">
            <i class="fas fa-chess"></i> Chess Lessons
          </router-link>
          <router-link to="/singing">
            <i class="fas fa-microphone"></i> Singing Lessons
          </router-link>
          <router-link to="/progress">
            <i class="fas fa-chart-line"></i> Track Progress
          </router-link>
        </div>
        <div class="footer-section">
          <h4>Connect with uh me?</h4>
          <a href="https://discord.com" target="_blank">
            <i class="fab fa-discord"></i> Join our Discord
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
<style scoped>
.footer {
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: auto;
  font-family: 'Arial', sans-serif;
}

/* GIF Background Styling */
.footer-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  filter: brightness(50%);
}

/* Overlay Content */
.footer-overlay {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff; /* Plain white text */
  padding: var(--spacing-md);
  width: 100%;
}

/* Grid Layout for Text Distribution */
.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  text-align: center;
  align-items: center;
}

/* Footer Section Styling */
.footer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.footer-section h3,
.footer-section h4,
.footer-section p {
  margin: 0;
  color: #ffffff; /* Ensure text is plain white */
  font-weight: normal;
}

.footer-section a {
  color: #ffffff;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.footer-section a:hover {
  opacity: 0.8;
}

.footer-section i {
  margin-right: 5px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .footer {
    height: 180px;
  }
  .footer-section h3,
  .footer-section h4 {
    font-size: 1rem;
  }
}
</style>
