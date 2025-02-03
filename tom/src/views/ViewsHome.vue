<template>
  <div class="home">
    <section class="hero">
      <div class="hero-background">
        <div class="particle-background"></div>
        <div class="gradient-overlay"></div>
        <div v-for="n in 50" :key="n" 
             :style="getRandomParticleStyle(n)"
             class="floating-particle">
        </div>
      </div>

      <div class="hero-content">
        <h1 class="title-gradient animate-slide-down">
           Chess Learning and Vocal Improvements!
        </h1>
        <p class="subtitle animate-slide-up">
          Learn chess and singing with interactive lessons
        </p>
        <div class="hero-buttons animate-fade-in">
          <button @click="navigateTo('/puzzles')" 
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

  <!-- Skills Grid : 3 -->
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
          route: "/puzzles",
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
    // Add computed properties for better performance, fr  : 3
    skillsCount() {
      return this.skills.length;
    }
  },
  methods: {
    navigateTo(route) {
      if (!route) return; 
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
    getRandomNumber(min, max, offset = 0) {
      return ((Math.random() * (max - min) + offset) % (max - min)) + min;
    }
  },
  created() {
    if (!Array.isArray(this.skills)) {
      console.error('Skills data is not properly initialized');
    }
  }
};
</script>

<style scoped>
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --primary: #3b82f6;
  --accent: #8b5cf6;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
}

.home {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: var(--text-primary);
}

.hero {
  height: 100vh; /* Full viewport height :3 */
  min-height: 100vh; /* Ensure it doesn't collapse */
  display: flex; /* Flexbox for centering */
  flex-direction: column; /* Stack content vertically */
  align-items: center; /* Center horizontally */
  justify-content: center; /* Center vertically */
  position: relative; /* Keep it positioned for child layers */
  overflow: hidden; /* Hide overflowing particles or animations */
  scroll-snap-align: start; /* Beloved snap scrolling if */
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle-background {
  position: absolute;
  inset: 0;
  background-image: url('https://i.pinimg.com/originals/4b/0c/06/4b0c06a9b539ed37469dbae7dfdd406a.gif');
  background-size: cover;
  opacity: 0.15;
  filter: brightness(1.5) contrast(1.2);
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

.skill-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.skill-card:hover {
trasnform: translateY(-8px) scale(1.05);
box-shadow: 0 8px 32px rgba(0,0,0,0.2);
background: rgba(30, 41, 59,0.6);
border-color:  rgba(255, 255 255, 0.2);
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
  padding: 2rem;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}


.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}



.description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.feature-list li {
  padding: 0.75rem 0;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}
.feature-list li {
  padding: 0.5rem 0;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-list li:hover {
  color: rgba(255, 255, 255, 0.9);
  transform: translateX(8px);
}
.feature-list li::before {
  content: '→';
  color: var(--primary);
  font-size: 1.2rem;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.feature-list li:hover::before {
  transform: translateX(4px);
  opacity: 1;
}

.card-footer {
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(5px);
}


.
.stats {
  display: flex;
  gap: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.rating {
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.card-image-container {
  position: relative;
  height: 240px;
  overflow: hidden;
}


.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-card:hover .card-image {
  transform: scale(1.1);
  filter: brightness(1.1) contrast(1.1);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.9),
    rgba(15, 23, 42, 0.2)
  );
  opacity: 0;
  transition: all 0.4s ease;
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.skill-card:hover .hover-message {
  opacity: 1;
  transform: translateY(0);
}
/*
.skill-card.bg-color-1 {
  background: linear-gradient(135deg, rgba(4, 255, 226, 0.1), rgba(0, 21, 255, 0.1));
}

.skill-card.bg-color-2 {
  background: linear-gradient(135deg, rgba(9, 94, 222, 0.1), rgba(5, 255, 213, 0.1));
}

.skill-card.bg-color-3 {
  background: linear-gradient(135deg, rgba(255, 205, 4, 0.1), rgba(7, 243, 219, 0.1));
}

.skill-card.bg-color-4 {
  background: linear-gradient(135deg, rgba(3, 216, 236, 0.1), rgba(0, 0, 0, 0.1));
}*/
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
/*
.bg-color-1 {
  background: linear-gradient(to right, #04ffe2, #0015ff);
}

.bg-color-2 {
  background: linear-gradient(to right, #095edeae, #05ffd5);
}

.bg-color-3 {
  background: linear-gradient(to right, #ffcd04, #07f3db);
}

.bg-color-4 {
  background: linear-gradient(to right, #03d8ec, #000000);
}
*/
.skill-card {
  border-radius: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  color: white; 
}

.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

html {
  scroll-behavior: smooth;
}

.hero {
  scroll-snap-align: start; 
}

.hero-buttons {
  margin-top: 2rem;
}


/*test fr fr fr fr ninga*/ 
/* Update the features section container */
.features {
  padding: 4rem 0; /* Reduced padding */
  width: 100%;
  margin: 0;
}

/* Update the skills grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Force 2 columns */
  gap: 2rem; /* Consistent gap */
  padding: 0 2rem; /* Add some padding on the sides */
  width: 100%;
  max-width: 100%;
}

/* Update the skill card */
.skill-card {
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px; /* Slightly reduced border radius */
  display: flex;
  flex-direction: column;
  aspect-ratio: 16/10; /* More rectangular aspect ratio */
}

/* Update the card image container */
.card-image-container {
  height: 200px; /* Fixed height */
  width: 100%;
}

/* Update the card content */
.card-content {
  padding: 1.5rem;
  flex: 1;
}

/* Update media queries for responsiveness */
@media (max-width: 1200px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .skills-grid {
    grid-template-columns: 1fr; /* Single column on mobile */
    padding: 0 1rem;
  }

  .skill-card {
    aspect-ratio: 16/12; /* Slightly taller on mobile */
  }

  .card-image-container {
    height: 180px;
  }
}

/* Optional: Update section title for better alignment */
.section-title {
  text-align: center;
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 3rem 0;
  padding: 0 1rem;
}

/* Update card footer */
.card-footer {
  padding: 1rem 1.5rem;
  margin-top: auto; /* Push to bottom */
}

/* Make sure images cover properly */
.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Update feature list for better spacing */
.feature-list {
  margin: 1rem 0;
}

.feature-list li {
  padding: 0.5rem 0;
}

/* Update hover effects */
.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}
</style>