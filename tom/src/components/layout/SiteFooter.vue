<template>
  <footer class="footer">
    <div class="footer-bg-container">
      <video v-if="isVideoBackground" autoplay loop muted playsinline class="footer-bg">
        <source :src="backgroundUrl" type="video/mp4">
      </video>
      <img v-else :src="backgroundUrl" alt="Footer Background" class="footer-bg" />
    </div>
    
    <div class="footer-overlay">
      <div class="footer-grid">
        <div class="footer-section">
          <h3>Your mom</h3>
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
<script>
export default {
  name: "SiteFooter",
  data() {
    return {
      backgroundUrl: 'https://cdn.pixabay.com/video/2023/07/13/171429-845465112_tiny.mp4',
    };
  },
  computed: {
    isVideoBackground() {
      const videoExtensions = ['mp4', 'webm', 'ogg'];
      const extension = this.backgroundUrl.split('.').pop().toLowerCase();
      return videoExtensions.includes(extension);
    }
  }
};
</script>

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

.footer-bg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.footer-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(50%);
}

.footer-overlay {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
  padding: var(--spacing-md);
  width: 100%;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  text-align: center;
  align-items: center;
}

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
  color: #ffffff;
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