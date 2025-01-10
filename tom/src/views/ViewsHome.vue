<template>
  <div class="home">
    <!-- Hero Section with Dynamic Background -->
    <section class="hero">
      <!-- Animated Background Layers -->
      <div class="hero-background">
        <!-- Particle GIF Background -->
        <div class="particle-background"></div>
        <!-- Dynamic Gradient Overlay -->
        <div class="gradient-overlay"></div>
        <!-- Animated Dots -->
        <div v-for="n in 50" :key="n" 
             :style="getRandomParticleStyle(n)"
             class="floating-particle">
        </div>
      </div>

      <div class="hero-content">
        <h1 class="title-gradient animate-slide-down">
          Master New Skills
        </h1>
        <p class="subtitle animate-slide-up">
          Learn chess and singing with interactive lessons
        </p>
        <div class="hero-buttons animate-fade-in">
          <button @click="navigateTo('/chess')" 
                  class="btn btn-primary pulse-animation">
            <span class="btn-content">
              <img src="https://cdn-icons-png.flaticon.com/512/4363/4363864.png" 
                   alt="Chess" 
                   class="btn-icon">
              Start Chess
            </span>
          </button>
          <button @click="navigateTo('/singing')" 
                  class="btn btn-secondary glow-animation">
            <span class="btn-content">
              <img src="https://cdn-icons-png.flaticon.com/512/3659/3659784.png" 
                   alt="Singing" 
                   class="btn-icon">
              Learn Singing
            </span>
          </button>
        </div>
      </div>
    </section>

  <!-- Skills Grid -->
<section class="features">
  <h2 class="section-title animate-slide-up">Featured Skills</h2>
  <div class="skills-grid">
    <div v-for="(skill, index) in skills" 
     :key="skill.id" 
     :class="['skill-card', getCardColor(index)]" 
     @click="navigateTo(skill.route)">
  <div class="card-image-container">
    <img :src="skill.image" 
         :alt="skill.title"
         class="card-image">
    <div class="image-overlay">
      <div class="overlay-content">
        <span class="difficulty">{{ skill.difficulty }}</span>
        <span class="duration">{{ skill.duration }}</span>
        <!-- New Hover Message with SVG -->
        <div class="hover-message">
          <svg class="hover-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p>Discover More!</p>
        </div>
      </div>
    </div>
  </div>
  <div class="card-content">
    <h3 class="card-title">{{ skill.title }}</h3>
    <p class="description">{{ skill.description }}</p>
    <ul class="feature-list">
      <li v-for="feature in skill.features" :key="feature">{{ feature }}</li>
    </ul>
  </div>
  <div class="card-footer">
    <button class="btn btn-outline shine-animation">Start Learning</button>
    <div class="stats">
      <span class="rating">{{ skill.stats.rating }} ★</span>
      <span class="students">{{ skill.stats.students }} students</span>
    </div>
  </div>
</div>

  </div>
</section>
  </div>
</template>

<script>
export default {
  name: "ViewsHome",
  data() {
    return {
      skills: [
        {
          id: 1,
          title: "Chess Mastery :3",
          description: "Master chess from basics to advanced strategies through interactive lessons with an integrated AI",
          route: "/chess",
          image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop",
          difficulty: "Beginner Friendly",
          duration: "12 Week Course",
          stats: {
            rating: 4.9,
            students: "2.3k"
          },
          features: [
            "Interactive board tutorials",
            "Strategy analysis tools",
            "Professional guidance"
          ]
        },
        {
          id: 2,
          title: "Vocal Training",
          description: "Develop your singing skills with professional vocal exercises, WE SHALLL SINGGGGGGGGG :3",
          route: "/singing",
          image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1470&auto=format&fit=crop",
          difficulty: "All Levels",
          duration: "8 Week Course",
          stats: {
            rating: 4.8,
            students: "1.8k"
          },
          features: [
            "Vocal range exercises",
            "Breathing techniques",
            "Performance tips"
          ]
        }
      ]
    };
  },
  computed: {
    // Add computed properties for better performance
    skillsCount() {
      return this.skills.length;
    }
  },
  methods: {
    navigateTo(route) {
      if (!route) return; // Add validation
      this.$router.push(route);
    },
    getCardColor(index) {
      const colors = ['bg-color-1', 'bg-color-2', 'bg-color-3', 'bg-color-4'];
      return colors[Math.abs(index) % colors.length]; // Added Math.abs for safety
    },
    getRandomParticleStyle(index) {
      // Ensure index is a number and has a default value
      const safeIndex = typeof index === 'number' ? index : 0;
      const randomX = this.getRandomNumber(0, 100, safeIndex * 10);
      const randomY = this.getRandomNumber(0, 100, safeIndex * 5);
      const randomDelay = this.getRandomNumber(-20, 10, safeIndex);
      const randomDuration = this.getRandomNumber(15, 25, safeIndex);

      return {
        left: `${randomX}%`,
        top: `${randomY}%`,
        animationDelay: `${randomDelay}s`,
        animationDuration: `${randomDuration}s`
      };
    },
    // Helper method for generating random numbers
    getRandomNumber(min, max, offset = 0) {
      return ((Math.random() * (max - min) + offset) % (max - min)) + min;
    }
  },
  created() {
    // Validate data on component creation
    if (!Array.isArray(this.skills)) {
      console.error('Skills data is not properly initialized');
    }
  }
};
</script>

<style scoped>
/* Theme Variables */
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --primary: #3b82f6;
  --accent: #8b5cf6;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
}

/* Base Styles */
.home {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: var(--text-primary);
}

/* Hero Section */
.hero {
  height: 90vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Background Elements */
.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle-background {
  position: absolute;
  inset: 0;
  background-image: url('https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif');
  background-size: cover;
  opacity: 0.15;
  filter: brightness(1.2) contrast(1.2);
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    rgba(14, 251, 160, 0.1),
    rgba(139, 92, 246, 0.1)
  );
  mix-blend-mode: overlay;
}

/* Floating Particles */
.floating-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  animation: float 20s linear infinite;
}

@keyframes float {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
    transform: translateY(-50vh) scale(1);
  }
  100% {
    transform: translateY(-100vh) scale(0);
    opacity: 0;
  }
}

/* Hero Content */
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  max-width: 800px;
}

.title-gradient {
  font-size: 4.5rem;
  font-weight: 800;
  background: linear-gradient(to right, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1.5rem;
}

.subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
}

/* Button Styles */
.hero-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* Animation Classes */
.animate-slide-down {
  animation: slideDown 1s ease-out;
}

.animate-slide-up {
  animation: slideUp 1s ease-out;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Skills Grid */
.features {
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 4rem;
  background: linear-gradient(to right, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
}

/* Card Styles */
.skill-card {
  background: var(--bg-secondary);
  border-radius: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.card-image-container {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.skill-card:hover .card-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.skill-card:hover .image-overlay {
  opacity: 1;
}

.card-content {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 0.5rem 0;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-list li::before {
  content: '→';
  color: var(--primary);
}

.card-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.447);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.rating {
  color: #fbbf24;
}

/* Responsive Design */
@media (max-width: 768px) {
  .title-gradient {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.25rem;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .section-title {
    font-size: 2.5rem;
  }
}

/* Card Hover Effects */
.card-image-container {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease, filter 0.5s ease;
}

.skill-card:hover .card-image {
  transform: scale(1.1);
  filter: blur(5px);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(229, 230, 230), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.skill-card:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  text-align: center;
  color: white;
  font-size: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hover-message {
  opacity: 0;
  transform: translateY(20px);
  animation: bounce 1.5s infinite;
}

.skill-card:hover .hover-message {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.5s ease;
}

.hover-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Add color classes for different backgrounds */
.bg-color-1 {
  background: linear-gradient(to right, #04ffe2, #0015ff);
}

.bg-color-2 {
  background: linear-gradient(to right, #de09a5, #1a28e8);
}

.bg-color-3 {
  background: linear-gradient(to right, #ffcd04, #f30723);
}

.bg-color-4 {
  background: linear-gradient(to right, #03d8ec, #000000);
}

/* Retain the transition for hover effects */
.skill-card {
  border-radius: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  color: white; /* Ensure text is visible on colorful backgrounds */
}

.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

</style>