<template>
  <div class="lesson-card">
    <img :src="image" alt="Lesson Image" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: "LessonCard",
  props: {
    title: String,
    description: String,
    image: String,
  },
};
</script>
