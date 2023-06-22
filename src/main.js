import { createApp } from 'vue'
import App from './App.vue'
import { createStore } from 'vuex'
import Axios from 'axios'
import VueAxios from 'vue-axios'
import VueNumerals from 'vue-numerals'
// import VueSpinners from 'vue-spinners'

import 'bootstrap/scss/bootstrap.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { AppStore } from './store/app_store.js'

const app = createApp(App)

const store = createStore({
    modules: {
        AppStore
    }
})

app.use(store)
app.use(VueNumerals)
app.use(VueAxios, Axios)
// app.use(VueSpinners)
app.mount('#app')