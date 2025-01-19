import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/main.css'

const app = createApp(App)
app.use(MotionPlugin)
app.use(router)
app.use(store)
app.mount('#app')