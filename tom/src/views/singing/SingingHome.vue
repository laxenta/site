<template>
  <div class="singing-container" :style="containerStyle">
    <div class="background-media-container">
      <video v-if="isVideoBackground" 
             class="background-media" 
             autoplay 
             loop 
             muted 
             playsinline>
        <source :src="backgroundUrl" :type="backgroundMediaType">
      </video>
            <img v-else 
           class="background-media"
           :src="backgroundUrl" 
           alt="background">
    </div>
    <header class="singing-header">
      <h1 class="text-gradient">Music Time! 🎵</h1>
      <p class="subtitle">Idk what to write here...</p>
    </header>

    <section class="video-grid">
      <div class="featured-video">
        <h2>Best Tutorial Song :3</h2>
        <div class="video-wrapper">
          <iframe
            width="100%"
            height="710"
            src="https://www.youtube.com/embed/uix25t_hFYI?si=9Rt33K1Ehw__uEt3"
            title="Mhmmm"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="video-info">
          <h3>Hell Yes!! Lets calm down uwu</h3>
          <p>Chill OUT BRO!</p>
        </div>
      </div>

      <div v-for="(video, index) in videos" :key="index" class="video-card">
        <div class="video-wrapper">
          <iframe
            width="100%"
            height="115"
            :src="video.embedUrl"
            :title="video.title"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="video-info">
          <h3>{{ video.title }}</h3>
          <p>{{ video.description }}</p>
          <div class="video-meta">
            <span class="views">{{ formatViews(video.views) }} views</span>
            <span class="duration">{{ video.duration }}</span>
          </div>
          <button @click="playVideo(video)" class="play-btn">
            Play Video :3
          </button>
        </div>
      </div>
    </section>
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">Close ×</button>
        <iframe
          v-if="selectedVideo"
          width="100%"
          height="800"
          :src="selectedVideo.embedUrl + '?autoplay=1'"
          :title="selectedVideo.title"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SingingHome',
  data() {
    return {
      showModal: false,
      selectedVideo: null,
      backgroundUrl:
        'https://cdn.pixabay.com/video/2024/05/22/213042_tiny.mp4',
      backgroundMediaType: 'video/mp4',
      videos: [
        {
          embedUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
          title: 'UwU',
          description:
            'Eat bananas? :3 lmao idk what to type in these boxes!',
          views: 4567891234,
          duration: '4:12'
        },
        {
          embedUrl: 'https://www.youtube.com/embed/_Yhyp-_hX2s',
          title: 'Somebody That I Used To Know',
          description: 'Gotye feat. Kimbra',
          views: 987654321,
          duration: '4:04'
        },
        {
          embedUrl: 'https://www.youtube.com/embed/JGwWNGJdvx8',
          title: 'Shape of You - Ed Sheeran',
          description: 'fr fr',
          views: 456789123,
          duration: '4:23'
        },
        {
          embedUrl: 'https://www.youtube.com/embed/GUPoR6N5c_Q',
          title: 'Sweet Dreams (Are Made of This)',
          description: 'Eurythmics - good old days of 80s fr',
          views: 789123456,
          duration: '3:36'
        }
      ],
      videosClicked: 0,
      startTime: Date.now(),
      timeSpent: 0
    }
  },
  computed: {
    isVideoBackground() {
      const videoExtensions = ['mp4', 'webm', 'ogg']
      const extension = this.backgroundUrl.split('.').pop().toLowerCase()
      return videoExtensions.includes(extension)
    },
    containerStyle() {
      return { position: 'relative', overflow: 'hidden' }
    }
  },
  methods: {
    formatViews(views) {
      if (views >= 1000000000) return (views / 1000000000).toFixed(1) + 'B'
      if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
      if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
      return views.toString()
    },
    playVideo(video) {
      this.selectedVideo = video
      this.showModal = true
      this.videosClicked++
      this.updateProgress()
    },
    closeModal() {
      this.showModal = false
      this.selectedVideo = null
      this.updateProgress()
    },
    updateProgress() {
      this.timeSpent = Date.now() - this.startTime
      const progressData = {
        videosClicked: this.videosClicked,
        timeSpent: this.timeSpent
      }
      localStorage.setItem('singingProgress', JSON.stringify(progressData))
    }
  },
  beforeDestroy() {
    this.updateProgress()
  }
}
</script>


<style scoped>
.singing-container {
  min-height: 100vh;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.background-media-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.background-media {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover;
  filter: blur(0px); 
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    rgba(76, 0, 255, 0.3), 
    rgba(255, 0, 128, 0.3)
  );
  animation: gradientFlow 15s ease infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.background-media {
  animation: fadeIn 1s ease-in;
}


.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(76, 0, 255, 0.15), rgba(255, 0, 128, 0.15));
  animation: gradientFlow 15s ease infinite;
  z-index: 1;
}

.singing-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 2;
}

.text-gradient {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 0 0 30px rgba(255,255,255,0.1);
}

.subtitle {
  color: #ecf0f1;
  font-size: 1.4rem;
  opacity: 0.9;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.video-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.featured-video {
  grid-column: 1 / -1;
  position: relative;
  transform: translateY(0);
  transition: transform 0.9s ease, box-shadow 0.3s ease;
}

.featured-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(45deg, #ff6b6b, #ffd93d);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  color: white;
  font-weight: bold;
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.featured-info {
  padding: 2rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.video-card {
  border-radius: 1.5rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

.video-card:hover, .featured-video:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
}

.video-info {
  padding: 1.5rem;
  color: #ecf0f1;
}

.video-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  opacity: 0.8;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.play-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(45deg, #4ecdc4, #45b7d1);
  color: white;
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.play-btn:hover {
  background: linear-gradient(45deg, #45b7d1, #4ecdc4);
  transform: scale(1.02);
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
  color: white;
  font-size: 1.2rem;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-active {
  opacity: 1;
}

.modal-content {
  width: 90%;
  max-width: 1200px;
  position: relative;
  border-radius: 1.5rem;
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.modal-active .modal-content {
  transform: scale(1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(231, 76, 60, 0.8);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: white;
  font-size: 1.5rem;
  z-index: 1001;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgb(231, 76, 60);
  transform: scale(1.1);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .singing-container {
    padding: 1rem;
  }

  .text-gradient {
    font-size: 2.5rem;
  }

  .video-grid {
    grid-template-columns: 1fr;
  }

  .featured-video iframe {
    height: 300px;
  }
}
</style>
<!-- > heyyy niggy wiggy :3 < -->