import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/ViewsHome.vue')
  },
  {
    path: '/chess',
    name: 'ChessHome',
    component: () => import('../views/chess/ChessHome.vue')
  },
  {
    path: '/chess/lesson/:id',
    name: 'ChessLesson',
    component: () => import('../views/chess/ChessLesson1.vue')
  },
  {
    path: '/singing',
    name: 'SingingHome',
    component: () => import('../views/singing/SingingHome.vue')
  },
  {
    path: '/singing/lesson/:id',
    name: 'SingingLesson',
    component: () => import('../views/singing/SingingLesson1.vue')
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('../views/ViewsProgress.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router