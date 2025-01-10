<template>
  <div class="background-audio">
    <!-- Mute/Unmute Button -->
    <button @click="toggleAudio" class="mute-button">
      <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5v14l7-7m5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10v4m0 0a4 4 0 004 4h2l4 4V6L9 10H7a4 4 0 00-4 4z" />
      </svg>
    </button>

    <!-- Hidden Audio Element -->
    <audio ref="audio" :src="audioSrc" loop></audio>
  </div>
</template>

<script>
export default {
  name: "BackgroundAudio",
  data() {
    return {
      audioSrc: require('@/assets/sounds/output.mp3'), // Ensure correct file path
      isMuted: false, // Default to not muted
    };
  },
  mounted() {
    const audio = this.$refs.audio;
    
    // Attempt to play audio when the page loads
    const playAudio = () => {
      audio.muted = false;
      audio.play().catch((err) => console.warn("Autoplay prevented:", err));
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
    };

    // Listen for the first interaction
    document.addEventListener('click', playAudio);
    document.addEventListener('touchstart', playAudio);
  },
  methods: {
    toggleAudio() {
      const audio = this.$refs.audio;
      if (audio) {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
        this.isMuted = audio.paused;
      } else {
        console.error("Audio element not found.");
      }
    },
  },
};
</script>

<style scoped>
.background-audio {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.mute-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.mute-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.icon {
  width: 24px;
  height: 24px;
}
</style>