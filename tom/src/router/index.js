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
    path: '/singing',
    name: 'SingingHome',
    component: () => import('../views/singing/SingingHome.vue')
  },
  {
    path: '/progress',
    name: 'ViewsProgress',
    component: () => import('../views/ViewsProgress.vue')
  },
  {
    path: '/chesshome',
    name: 'ChessHome',
    component: () => import('../views/chess/ChessHome.vue')
  },
  {
    path: '/puzzles',
    name: 'ChessPuzzles',
    component: () => import('../views/chess/ChessPuzzles.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router