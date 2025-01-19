<template>
  <div class="app-container">
    <NavbarBar />
    <!-- Background Audio Component -->
    <BackgroundAudio />
    <main class="main-content">
      <router-view></router-view>
    </main>
    <SiteFooter />
  </div>
</template>

<script>
import NavbarBar from './components/layout/NavBar.vue';
import SiteFooter from './components/layout/SiteFooter.vue';
import BackgroundAudio from './components/layout/BackgroundAudio.vue';

export default {
  name: 'App',
  components: {
    NavbarBar,
    SiteFooter,
    BackgroundAudio,
  }
}
</script>

<style>
:root {
  --primary: #2563eb;
  --secondary: #1e293b;
  --accent: #3b82f6;
  --background: #f8fafc;
  --text: #1e293b;
  --text-light: #64748b;
  --border: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--background);
  color: var(--text);
  line-height: 1.5;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>