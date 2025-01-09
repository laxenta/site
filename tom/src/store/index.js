import { createStore } from 'vuex'
import chess from './modules/chess'
import singing from './modules/singing'
import progress from './modules/progress'

export default createStore({
  modules: {
    chess,
    singing,
    progress
  }
})