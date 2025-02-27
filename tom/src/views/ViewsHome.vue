<template>
  <div class="home">
    <section class="hero">
      <div class="hero-background">
        <div class="particle-background"></div>
        <div class="gradient-overlay"></div>
        <div
          v-for="n in 50"
          :key="n"
          :style="getRandomParticleStyle(n)"
          class="floating-particle"
        ></div>
      </div>
      <div class="hero-content">
        <h1 class="title-gradient animate-slide-down">
          Chess Learning and Vocal Improvements!
        </h1>
        <p class="subtitle animate-slide-up">
          Learn chess, singing, yoga and more with interactive lessons
        </p>
        <div class="hero-buttons animate-fade-in">
          <button
            @click="navigateTo('/puzzles')"
            class="btn btn-primary pulse-animation"
          >
            <span class="btn-content">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4363/4363864.png"
                alt="Chess"
                class="btn-icon"
              />
              Start Chess
            </span>
          </button>
          <button
            @click="navigateTo('/singing')"
            class="btn btn-secondary glow-animation"
          >
            <span class="btn-content">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3659/3659784.png"
                alt="Singing"
                class="btn-icon"
              />
              Learn Singing
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="section-title animate-slide-up">Featured Skills</h2>
      <div class="skills-grid">
        <div
          v-for="skill in skills"
          :key="skill.id"
          class="skill-card"
          @click="navigateTo(skill.route)"
        >
          <div class="card-image-container">
            <img :src="skill.image" :alt="skill.title" class="card-image" />
            <div class="dark-overlay">
              <div class="overlay-popup">
                <!-- SVG icon forced to 16x16 -->
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8b5cf6"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="popup-icon"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                <p class="popup-text">Discover More</p>
              </div>
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ skill.title }}</h3>
            <p class="description">{{ skill.description }}</p>
            <ul class="feature-list">
              <li v-for="feature in skill.features" :key="feature">
                {{ feature }}
              </li>
            </ul>
          </div>
          <div class="card-footer">
            <button class="btn-outline">Start Learning</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: "ViewsHome",
  data() {
    return {
      skills: [
        {
          id: 1,
          title: "Chess Puzzles",
          description:
            "Solve chess Puzzles from basics to advanced strategies with interactive puzzles.",
          route: "/puzzles",
          image: "https://cdn.builtin.com/cdn-cgi/image/f=auto,fit=cover,w=1200,h=635,q=80/https://builtin.com/sites/www.builtin.com/files/2022-10/chess-AI.jpg", 
          difficulty: "Beginner Friendly",
          //duration: "", removing durations
          features: [
            "Interactive board tutorials",
            "Strategy analysis tools",
            "Professional guidance",
          ],
        },
        {
          id: 2,
          title: "Multiplayer Chess",
          description:
            "Challenge others in real-time multiplayer chess games.",
          route: "/multiplayer",
          image:
            "https://cdn.pixabay.com/photo/2017/09/08/20/29/chess-2730034_960_720.jpg",
          difficulty: "Varies",
          duration: "Live",
          features: [
            "Real-time matches",
            "Will be Under Development if i got another payment",
          ],
        },
        {
          id: 3,
          title: "Yoga Poses",
          description:
            "Enhance your flexibility and mindfulness with guided yoga sessions.",
          route: "/yoga",
          image:
            "https://www.verywellfit.com/thmb/RByTJzWk8D-np-YuLmvuilKOFRc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/beachstretch-56aa41b63df78cf772aedf91.jpg",
          difficulty: "All Levels",
          duration: "6 Week Course",
          features: [
            "Machine learning provided guidance",
            "Pose Detection",
            "Daily routines",
          ],
        },
        {
          id: 4,
          title: "Singing Tutorials",
          description:
            "Learn singing with cute YouTube lessons.",
          route: "/singing",
          image:
            "https://queerdoc.com/media/2022/04/voice-training-300x300.jpg",
          difficulty: "All Levels",
          duration: "Depends on you!",
          features: [
            "Tutorials",
            "Learning",
            "Performance tips",
          ],
        },
        {
          id: 5,
          title: "Vocal/Notes Training",
          description:
            "Practice your notes with a proper pitch detector.",
          route: "/vocal",
          image:
            "https://tonalitymusic.com.ng/wp-content/uploads/2019/08/569c701e7ed44_voice-lessons.jpg",
          difficulty: "Advanced",
          duration: "10 Week Course",
          features: [
            "Vocal Note Detection",
            "Performance scores",
            "Stage presence",
          ],
        },
        {
          id: 6,
          title: "Progress Tracker",
          description:
            "Monitor your learning progress with detailed analytics and insights.",
          route: "/progress",
          image:
            "https://i.pinimg.com/564x/7c/ab/60/7cab60f5f7f47f9bf172a035b3fb0301.jpg",
          difficulty: "All Levels",
          duration: "Ongoing",
          features: [
            "Detailed analytics",
            "Performance graphs",
            "Personalized insights",
          ],
        },
      ],
    };
  },
  methods: {
    navigateTo(route) {
      if (!route) return;
      this.$router.push(route);
    },
    getRandomParticleStyle(n) {
      const randomX = this.getRandomNumber(0, 100, n * 10);
      const randomY = this.getRandomNumber(0, 100, n * 5);
      const randomDelay = this.getRandomNumber(-20, 10, n);
      const randomDuration = this.getRandomNumber(15, 25, n);
      return {
        left: `${randomX}%`,
        top: `${randomY}%`,
        animationDelay: `${randomDelay}s`,
        animationDuration: `${randomDuration}s`,
      };
    },
    getRandomNumber(min, max, offset = 0) {
      return ((Math.random() * (max - min) + offset) % (max - min)) + min;
    },
  },
};
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #0a0a0a;
  color: #e0e0e0;
  line-height: 1.6;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

.home {
  min-height: 100vh;
  background-color: #121212;
}

.hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://i.pinimg.com/originals/4b/0c/06/4b0c06a9b539ed37469dbae7dfdd406a.gif')
    no-repeat center center;
  background-size: cover;
  opacity: 0.1;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 20, 0.6));
}

.hero-content {
  position: relative;
  text-align: center;
  max-width: 800px;
  padding: 20px;
  z-index: 2;
}

.title-gradient {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(to right, #8b5cf6, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 1.25rem;
  color: #aaa;
  margin-bottom: 30px;
}

.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #8b5cf6;
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 2px solid #8b5cf6;
  color: #fff;
}

.btn:hover {
  opacity: 0.85;
}

.btn-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.popup-icon {
  width: 16px !important;
  height: 16px !important;
  display: inline-block;
  margin-bottom: 8px;
}

.features {
  padding: 60px 20px;
  background: #121212;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(to right, #8b5cf6, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 10px;
}

.skill-card {
  background: #1e1e1e;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.7);
}

.card-image-container {
  position: relative;
  height: 200px;
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

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.skill-card:hover .dark-overlay {
  opacity: 1;
}

.overlay-popup {
  text-align: center;
  color: #fff;
}

.popup-text {
  font-size: 1.1rem;
  font-weight: 600;
}

.card-content {
  padding: 20px;
  flex: 1;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(to right, #8b5cf6, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.description {
  font-size: 1rem;
  color: #aaa;
  margin-bottom: 15px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  font-size: 0.95rem;
  color: #ccc;
  padding: 5px 0;
  border-bottom: 1px solid #2a2a2a;
}

.card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 20px;
  background: #141414;
  border-top: 1px solid #2a2a2a;
}

.btn-outline {
  background: transparent;
  border: 1px solid #8b5cf6;
  color: #8b5cf6;
  padding: 5px 15px;
  border-radius: 5px;
  font-size: 0.9rem;
  transition: background 0.3s ease, color 0.3s ease;
}

.btn-outline:hover {
  background: #8b5cf6;
  color: #fff;
}
</style>