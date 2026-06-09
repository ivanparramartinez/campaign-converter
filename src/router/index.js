import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',              name: 'home',      component: () => import('../views/HomeView.vue') },
  { path: '/setup',         name: 'setup',     component: () => import('../views/CampaignSetupView.vue') },
  { path: '/checker',       name: 'checker',   component: () => import('../views/CheckerView.vue') },
  { path: '/generator',     name: 'generator', component: () => import('../views/GeneratorView.vue') },
  { path: '/trim-matrix',   name: 'trim-matrix',   component: () => import('../views/TrimMatrixView.vue') },
  { path: '/trim-collection', name: 'trim-collection', component: () => import('../views/TrimCollectionView.vue') },
  { path: '/interior',      name: 'interior',  component: () => import('../views/InteriorView.vue') },
  { path: '/models',        name: 'models',    component: () => import('../views/ModelsView.vue') },
  { path: '/exteriors',     name: 'exteriors', component: () => import('../views/ExteriorsView.vue') },
  { path: '/viewer',        name: 'viewer',    component: () => import('../views/ViewerView.vue') },
  { path: '/dealer-replace', name: 'dealer-replace', component: () => import('../views/DealerReplaceView.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
