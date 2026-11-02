import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './styles/base.css';
import './styles/panel.css';

createApp(App).use(createPinia()).mount('#app');
