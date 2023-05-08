import {createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw} from 'vue-router'
import NftMarketHome from '../views/NftMarketHome.vue'
import CreateNft from '../views/CreateNft.vue'
import UserInformation from '../views/UserInformation.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'NftMarketHome',
    component: NftMarketHome
  },
  {
    path: '/user',
    name: 'UserInformation',
    component: UserInformation
  },
  {
    path: '/create',
    name: 'CreateNft',
    component: CreateNft
  },
]

const router = createRouter({
  // history: createWebHashHistory(),
  history: createWebHistory(),
  routes
})

export default router
