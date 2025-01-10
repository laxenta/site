<template>
  <nav class="navbar">
      <ul class="nav-links">
          <li>
              <router-link to="/" class="nav-item">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <span>Home</span>
              </router-link>
          </li>
          <li>
              <router-link to="/chess" class="nav-item">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
                  </svg>
                  <span>Chess</span>
              </router-link>
          </li>
          <li>
              <router-link to="/singing" class="nav-item">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
                  </svg>
                  <span>Singing</span>
              </router-link>
          </li>
          <li>
              <router-link to="/progress" class="nav-item">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Progress</span>
              </router-link>
          </li>
      </ul>
  </nav>
  </template>
  
  <script>
  export default {
      name: "NavBar"
  };
  </script>
  
  <style scoped>
  .navbar {
    position: fixed;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(17, 24, 39, 0.8);
    backdrop-filter: blur(8px);
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.nav-links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #e5e7eb;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
}

.icon {
    width: 1.5rem;
    height: 1.5rem;
    stroke-width: 1.5;
}

/* Active link styling */
.router-link-active {
    background: rgba(59, 130, 246, 0.5);
    color: white;
}

/* Optional: Add some subtle animations */
.nav-item {
    position: relative;
    overflow: hidden;
}

.nav-item::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #3b82f6;
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.nav-item:hover::after {
    transform: scaleX(1);
}
</style>