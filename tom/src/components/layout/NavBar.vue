<template>
  <nav class="navbar" :class="{'collapsed': isCollapsed}" @mouseenter="expandNavbar" @mouseleave="collapseNavbar">
    <!-- Collapse Button -->
    <div class="collapse-button" @click="toggleCollapse">
      <span v-if="isCollapsed">🖳</span>
      <span v-else>🌪</span>
    </div>

    <!-- Nav Links -->
    <ul class="nav-links" v-show="!isCollapsed">
      <li>
        <router-link to="/" class="nav-item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Home</span>
        </router-link>
      </li>
      <li>
        <router-link to="/singing" class="nav-item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M2 8a6 6 0 016-6h8a6 6 0 016 6v8a6 6 0 01-6 6H8a6 6 0 01-6-6V8z"
            />
            <path
              d="M8 12h8M8 16h4"
            />
          </svg>
          <span>Music Tutorials</span>
        </router-link>
      </li>
      <li>
        <router-link to="/vocal" class="nav-item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Vocal Training</span>
        </router-link>
      </li>
      <li>
        <router-link to="/puzzles" class="nav-item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M2 8a6 6 0 016-6h8a6 6 0 016 6v8a6 6 0 01-6 6H8a6 6 0 01-6-6V8z"
            />
            <path
              d="M8 12h8M8 16h4"
            />
          </svg>
          <span>Chess Puzzles</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "NavBar",
  data() {
    return {
      isCollapsed: true,
      backgroundUrl: 'empty fr :3 ', 
    };
  },
  computed: {
    isVideoBackground() {
      const videoExtensions = ['mp4', 'webm', 'ogg'];
      const extension = this.backgroundUrl.split('.').pop().toLowerCase();
      return videoExtensions.includes(extension);
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    expandNavbar() {
      this.isCollapsed = false;
    },
    collapseNavbar() {
      if (!this.isCollapsed) {
        this.isCollapsed = true;
      }
    }
  }
};
</script>

<style scoped>
.navbar {
  position: fixed;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 250px;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
  transition: width 0.5s ease, opacity 0.5s ease, transform 0.3s ease;
}

.navbar.collapsed {
  width: 50px;
  opacity: 0.5;
  transform: scale(0.95);
}

.navbar-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}
.background-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collapse-button {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 25px;
  height: 30px;
  background-color: #1e293b;
  color: white;
  border-radius: 150%;
  transition: transform 0.3s ease, background-color 0.2s ease;
}

.collapse-button span {
  font-size: 18px;
  font-weight: bold;
  transition: transform 0.2s ease;
}

.collapse-button:hover {
  background-color: #3b82f6; 
  transform: scale(1.1);
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  overflow: hidden;
  transition: all 0.5s ease;
}

.nav-links li {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.navbar:not(.collapsed) .nav-links li {
  opacity: 1;
  transform: translateX(0);
}

/* Nav item styling */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #e5e7eb;
  text-decoration: none;
  padding: 0.4rem 1.2rem;
  border-radius: 10px;
  transition: background 0.3s ease, transform 0.3s ease, color 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(6px);
  color: #3b82f6; 
}

.icon {
  width: 1.6rem;
  height: 1.6rem;
  stroke-width: 1.5;
  transition: stroke 0.2s ease;
}

.router-link-active {
  background: rgba(59, 130, 246, 0.5);
  color: white;
}

.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #3b82f6;
  transform: scaleX(0);
  transition: transform 0.8s ease;
}

.nav-item:hover::after {
  transform: scaleX(1);
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(59, 130, 246, 0.2);
  border-radius: 18px;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-item:hover::before {
  transform: scaleX(1);
}

.nav-item span {
  display: none;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.navbar:not(.collapsed) .nav-item span {
  display: inline;
  opacity: 1;
}

.nav-links {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.6) rgba(0, 0, 0, 0.2);
}

.nav-links::-webkit-scrollbar {
  width: 10px;
}

.nav-links::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 9px;
}

.nav-links::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}
</style>