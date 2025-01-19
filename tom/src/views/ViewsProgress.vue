<template>
  <div class="progress">
    <h1>ehe</h1>
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
  name: "ViewsProgress",
  components: {
    LessonCard,
  },
  data() {
    return {
      skills: [
        {
          id: 1,
          title: "Chess Mastery",
          description: "Learn chess from basics to advanced strategies through 6 comprehensive lessons.",
          route: "/chess",
          image: "chess",
        },
        {
          id: 2,
          title: "Vocal Training",
          description: "Develop your singing skills with 4 interactive vocal lessons.",
          route: "/singing",
          image: "singing",
        },
      ],
    };
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route);
    },
    getImage(imageKey) {
      const images = {
        chess: "https://example.com/chess-image.jpg",
        singing: "https://example.com/singing-image.jpg",
      };
      return images[imageKey] || "https://example.com/singing-image.jpg";
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
</style>
