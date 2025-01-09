<template>
  <div class="home">
    <h1>Welcome to Skills Hub</h1>
    <div class="skills-grid">
      <LessonCard
        v-for="skill in skills"
        :key="skill.id"
        :title="skill.title"
        :description="skill.description"
        :image="getImage(skill.image)"
        @click="navigateTo(skill.route)"
      />
    </div>
  </div>
</template>

<script>
import LessonCard from "../components/shared/LessonCard.vue";

export default {
  name: "ViewsHome",
  components: {
    LessonCard,
  },
  data() {
    return {
      skills: [
        {
          id: 1,
          title: "Chess Mastery",
          description: "Learn chess from basics to advanced strategies through 6 comprehensive lessons",
          route: "/chess",
          image: "chess" // Logical identifier for the image
        },
        {
          id: 2,
          title: "Vocal Training",
          description: "Develop your singing skills with 4 interactive vocal lessons",
          route: "/singing",
          image: "singing" // Logical identifier for the image
        },
      ],
    };
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route);
    },
    getImage(imageKey) {
      // Dynamically resolve image paths based on the key
      const images = {
        chess: "https://images-ext-1.discordapp.net/external/SqdheLUMJIRcC14LSoysWvtVrPQRZKVzSJn_A3WQ7j4/https/uvdxvgggjphy9pqb.public.blob.vercel-storage.com/Image_2025-01-06T13%3A55%3A27.167Z-3eNL5gKFxHqKKV7OXAUoTR8uhTeAwf.jpg?format=webp&width=416&height=416",
        singing: "https://images-ext-1.discordapp.net/external/SqdheLUMJIRcC14LSoysWvtVrPQRZKVzSJn_A3WQ7j4/https/uvdxvgggjphy9pqb.public.blob.vercel-storage.com/Image_2025-01-06T13%3A55%3A27.167Z-3eNL5gKFxHqKKV7OXAUoTR8uhTeAwf.jpg?format=webp&width=416&height=416",
      };
      return images[imageKey] || "https://example.com/placeholder.png"; // Fallback image
    },
  },
};
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f3f4f7, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

h1 {
  text-align: center;
  color: #34495e;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-family: "Poppins", sans-serif;
}

.lesson-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.lesson-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.lesson-card img {
  max-width: 100%;
  border-radius: 8px;
}

.lesson-card h2 {
  margin-top: 1rem;
  font-size: 1.5rem;
  color: #2c3e50;
  font-family: "Poppins", sans-serif;
}

.lesson-card p {
  font-size: 1rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
  text-align: center;
}
</style>
