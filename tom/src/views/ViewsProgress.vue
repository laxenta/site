<template>
  <div class="progress-page">
    <header class="progress-header">
      <h1>Progress Tracker</h1>
      <p>Simply Track your progress across different stuff</p>
    </header>
    <div class="progress-cards">
      <div v-for="item in progressItems" :key="item.key" class="progress-card">
        <h2>{{ item.title }}</h2>
        <p class="card-description">{{ item.description }}</p>
        <div class="progress-details">
          <div v-if="progressData[item.key]">
            <template v-if="item.key === 'chessProgress'">
              <p>
                <strong>Puzzles Solved:</strong>
                {{ progressData[item.key].puzzlesSolved || 0 }}
              </p>
              <p>
                <strong>Time Spent:</strong>
                {{ formatTime(progressData[item.key].timeSpent) }}
              </p>
            </template>
            <template v-else>
              <p>
                <strong>Videos Clicked:</strong>
                {{ progressData[item.key].videosClicked || progressData[item.key].lessonsCompleted || 0 }}
              </p>
              <p>
                <strong>Time Spent:</strong>
                {{ formatTime(progressData[item.key].timeSpent) }}
              </p>
            </template>
          </div>
          <div v-else>
            <p>No progress recorded yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProgressPage",
  data() {
    return {
      progressItems: [
        {
          key: "singingProgress",
          title: "Singing Progress",
          description: "Your progress on singing lessons."
        },
        {
          key: "chessProgress",
          title: "Chess Progress",
          description: "Your progress on chess puzzles."
        }
      ],
      progressData: {}
    }
  },
  created() {
    this.loadProgressData();
  },
  methods: {
    loadProgressData() {
      this.progressItems.forEach(item => {
        const stored = localStorage.getItem(item.key);
        if (stored) {
          try {
            this.progressData[item.key] = JSON.parse(stored);
          } catch (e) {
            console.error(`Error parsing progress for ${item.key}:`, e);
            this.progressData[item.key] = null;
          }
        } else {
          this.progressData[item.key] = null;
        }
      });
    },
    formatTime(ms) {
      if (!ms || ms <= 0) return "0 seconds";
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return minutes > 0
        ? `${minutes} minute(s) ${seconds} second(s)`
        : `${seconds} second(s)`;
    }
  }
}
</script>

<style scoped>
.progress-page {
  background: #000;
  color: #fff;
  min-height: 100vh;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
}
.progress-header {
  text-align: center;
  margin-bottom: 2rem;
}
.progress-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #ffdd57;
}
.progress-header p {
  font-size: 1.2rem;
  color: #ccc;
}
.progress-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}
.progress-card {
  background: #111;
  border: 2px solid #444;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}
.progress-card h2 {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: #4ecdc4;
}
.card-description {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #ccc;
}
.progress-details {
  background: #222;
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 1.1rem;
  color: #fff;
}
.progress-details p {
  margin: 0.75rem 0;
}
</style>
<!-- this is a protoype honestly lol-->