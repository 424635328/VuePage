// src/main.js

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import { createHead } from '@vueuse/head'
import lazyLoadDirective from './directives/lazyLoad'

import App from './App.vue'
import router from './router'

// 导入唯一的全局样式文件
import './assets/styles/main.scss'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.use(head)

// 注册自定义指令
app.directive('lazy-load', lazyLoadDirective)

app.mount('#app')
