import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/ViewsHome.vue')
  },
  {
    path: '/yoga',
    name: 'Yoga',
    component: () => import('../views/YogaPose.vue')
  },
  {
    path: '/singing',
    name: 'SingingHome',
    component: () => import('../views/singing/SingingHome.vue')
  },
  {
    path: '/vocal',
    name: 'VocalTraining',
    component: () => import('../views/singing/VocalPage.vue')
  },
  {
    path: '/progress',
    name: 'ViewsProgress',
    component: () => import('../views/ViewsProgress.vue')
  },
  {
    path: '/puzzles',
    name: 'ChessPuzzles',
    component: () => import('../views/chess/ChessPuzzles.vue')
  },
  {
    path: '/multiplayer',
    name: 'Multiplayer',
    component: () => import('../views/chess/MultiplayerChess.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router