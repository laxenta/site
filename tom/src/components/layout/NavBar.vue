<!-- src/components/layout/NavbarBar.vue -->
<template>
  <nav class="navbar">
    <ul>
      <li><router-link to="/">Home</router-link></li>
      <li><router-link to="/chess">Chess</router-link></li>
      <li><router-link to="/singing">Singing</router-link></li>
      <li><router-link to="/progress">Progress</router-link></li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "NavBar",
};
</script>


<style scoped>
.lesson-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
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