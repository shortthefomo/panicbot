<template>
    <div class="app-wrapper black-background">
        <div class="container-fluid">
            <XummSignin @signin_complete="signinCompleted" :key_set="keySet"/>
            <div v-if="signinComplete">
                <div class="position-relative">
                    <button class="btn btn-purple float-end me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" title="settings"><i class="bi bi-ui-checks"></i></button>
                    <!-- <button class="btn btn-primary float-end me-2" type="button" v-on:click="supportLaunch" title="twitter"><i class="bi bi-twitter"></i></button> -->
                </div>
                
                <div v-if="forexSwitch" class="row">
                    <div class="col-4">
                        <h2>forex rate</h2>
                        <h1>{{$store.getters.getFxRate}} {{$store.getters.getFxPair}}</h1>
                    </div>
                    <!-- eslint-disable-next-line -->
                    <!-- <ForexRate v-for="route in routes" :route="route" :exchange="route.key" :exchange_name="route.name" :pair="$store.getters.getFxPair" :base="route.base" :quote="route.quote" />  -->
                </div>
                <!-- <div v-if="routes.length > 0" class="row">
                    <Balanaces :routes="routes" />
                </div> -->

                <component :is="exchanges" v-if="exchangeSwitch" @load_routes="initbot" :bot="bot" :bot_status="bot_status"/>
                <div v-if="bot_status != 'stopped'">
                    <div v-if="routes.length > 0 && bookSwitch">
                        <!-- eslint-disable-next-line -->
                        <div v-for="route in routes">
                            <div v-if="route.key == exchange_selected" class="row" style="min-height: 800px;">
                                <ChartLightWeight :bot="bot" :exchange_key="route.key"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="bot_status != 'stopped'">
                    <div v-if="routes.length > 0 && bookSwitch" class="row">
                        <!-- eslint-disable-next-line -->
                        <div :class="(route.name !== 'dex-gatehub' && route.name !== 'dex-bitstamp') ? 'col-2': 'col-4'" v-for="route in routes">
                            <component :is="books" @exchange_selected="exchangeSelected" :selected="exchange_selected" :bot="bot" :exchange_key="route.key" :exchange_name="route.name"  :show="conversions" :info="info" :base="route.base" :quote="route.quote" :items="bookItem"  />
                        </div>
                        
                    </div>
                    <div v-if="historySwitch" class="row mb-4">
                        <div class="col">
                            <component :is="history"  :enviroment="enviroment" :items="historyItem" />
                        </div>
                    </div>
                </div>

                <div v-if="liquiditySwitch" class="row">
                    <LiquidityX :routes="routes" :legs="legs" :fee="feeSwitch" :bot="bot" :globe="globeSwitch"/> 
                </div>
                <div v-if="infoSwitch" class="row">
                    <div class="col">
                        <Avitar />
                    </div>
                    <div class="col">
                        <ServerInformation :server_info="xrpl_node" />
                    </div>
                    <div class="col">
                        <AppInformation :routes="routes" />
                    </div>
                </div>

                <div ref="bsOffcanvas" class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
                    <div class="offcanvas-header">
                        <h5 class="offcanvas-title" id="offcanvasRightLabel">Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div class="offcanvas-body">
                        <div id="v-model-select-dynamic" class="demo">
                            <label for="basic-url" class="form-label">Widgets</label>
                            <div class="form-check form-switch">
                                <input v-model="historySwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchHistory" checked>
                                <label class="form-check-label" for="flexSwitchHistory">History</label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="bookSwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchBook" checked>
                                <label class="form-check-label" for="flexSwitchBook">Book</label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="infoSwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchInfo" checked>
                                <label class="form-check-label" for="flexSwitchInfo">Info</label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="liquiditySwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchLiquidity" checked>
                                <label class="form-check-label" for="flexSwitchLiquidity">Liquidity</label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="globeSwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchLiquidity" checked>
                                <label class="form-check-label" for="flexSwitchGlobe">Globe</label>
                            </div>
                            <div class="form-check form-switch">
                                <input v-model="feeSwitch" class="form-check-input" type="checkbox" role="switch" id="flexSwitchFee" checked>
                                <label class="form-check-label" for="flexSwitchFee">include fee</label>
                            </div>
                            <div class="input-group mb-2">
                                <span class="input-group-text">Book Items</span>
                                <select v-model="bookItem" v-on:change="handleChangeBookItems($event)">
                                    <option v-for="(option, index) in bookItems" :value="option.value" :key="index">
                                    {{ option.label }}
                                    </option>
                                </select>
                            </div>
                            <div class="input-group mb-2">
                                <span class="input-group-text">History Items</span>
                            
                                <select v-model="historyItem" v-on:change="handleChangeHistoryItems($event)">
                                    <option v-for="(option, index) in historyItems" :value="option.value" :key="index">
                                    {{ option.label }}
                                    </option>
                                </select>
                            </div>

                            <button type="button" v-on:click="setKeys" class="btn btn-warning mb-2">Exchange Access</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */
    import { XrplClient } from 'xrpl-client'
    import { Offcanvas } from 'bootstrap'
    import { defineComponent, shallowRef } from 'vue'
    // import { shell } from 'electron'

    import OrderLiquidity from './components/OrderLiquidity.vue'
    import OrderTip from './components/OrderTip.vue'
    import OrderBook from './components/OrderBook.vue'
    import TradeHistory from './components/TradeHistory.vue'
    import ServerInformation from './components/ServerInformation.vue'
    import AppInformation from './components/AppInformation.vue'
    import InterfaceSelection from './components/InterfaceSelection.vue'
    import LiquidityX from './components/LiquidityX.vue'
    import ForexRate from './components/ForexRate.vue'
    import Balanaces from './components/Balanaces.vue'
    import ChartLightWeight from './components/ChartLightWeight.vue'
    import XummSignin from './components/XummSignin.vue'
    import XRPL from './plugin/exchange/dex/xrpl.js'
    import PanicBot from './plugin/bot/panic-bot/panic-bot.js'

    // let client = new XrplClient(['ws://192.168.0.20:6005', 'wss://xrplcluster.com', 'wss://s2.ripple.com'])
    let client = new XrplClient(['wss://node.panicbot.xyz', 'wss://xrplcluster.com', 'wss://s2.ripple.com'])

    export default {
        name: 'App',
        components: {
            OrderTip,
            OrderLiquidity,
            OrderBook,
            TradeHistory,
            ServerInformation,
            AppInformation,
            Offcanvas,
            InterfaceSelection,
            LiquidityX,
            ForexRate,
            Balanaces,
            ChartLightWeight,
            XummSignin
        },
        data() {
            return {
                bot: new PanicBot(this.$store),
                bot_status: 'stopped',
                exchange_selected: null,
                signinComplete: false,
                quote: '',
                base: '',
                warning: '',
                routes: [],
                legs: {},
                exchanges: null,
                exchangeSwitch: true,
                books: null,
                bookSwitch: true,
                history: null,
                historySwitch: true,
                enviroment: 'production',
                conversions: false,
                info: false,
                infoSwitch: true,
                liquiditySwitch: false,
                globeSwitch: true,
                feeSwitch: true,
                forexSwitch: true,
                isLoading: true,
                keySet: false,
                bookItems: [
                    {label : '1', value: 1},
                    {label : '2', value: 2},
                    {label : '3', value: 3},
                    {label : '5', value: 5},
                    {label : '10', value: 10},

                ],
                bookItem: 10,
                historyItems: [
                    {label : '5', value: 5},
                    {label : '10', value: 10},
                    {label : '20', value: 20},
                    {label : '50', value: 50},
                    {label : '100', value: 100},
                ],
                historyItem: 20,               
            }
        },
        async unmounted() {
            console.warn('App unmounted')
            if ( this.bot == null) { return }
            await this.stop()
        },
        async mounted() {
            console.warn('App mounted')
            if (this.isLoading) {
                this.toggleInterface()
                this.toggleBook()
                this.toggleHistory()
            }
        },
        methods: {
            supportLaunch() {
                //todo figure this out...
                // shell.openExternal('https://github.com')
            },
            setKeys() {
                this.keySet = false
                this.signinComplete = false
            },
            signinCompleted(value) {
                this.signinComplete = true
                this.keySet = true
                const self = this
                setTimeout(() => {
                    self.offcanvas = new Offcanvas(this.$refs.bsOffcanvas )    
                }, 500)
            },
            exchangeSelected(exchange) {
                console.log('exchange value', exchange)
                this.exchange_selected = exchange
            },
            toggleInterface(){
                if (this.exchanges != null) { 
                    this.exchanges = null 
                    return
                }
                this.exchanges = shallowRef(defineComponent({ extends: InterfaceSelection }))
            },
            toggleBook(){
                if (this.books != null) { 
                    this.books = null 
                    return
                }
                console.log('books')
                this.books = shallowRef(defineComponent({ extends: OrderBook }))
            },
            toggleHistory(){
                if (this.history != null) { 
                    this.history = null 
                    return
                }
                this.history = shallowRef(defineComponent({ extends: TradeHistory }))
            },

            handleChangeBookItems(event) {
                console.log(event.target.value)
                this.bookItem = event.target.value
            },
            handleChangeHistoryItems(event) {
                console.log(event.target.value)
                this.historyItem = event.target.value
            },
            async pause(milliseconds = 1000) {
                return new Promise(resolve =>  {
                    console.log('pausing....')
                    setTimeout(resolve, milliseconds)
                })
            },
            async initbot(routes, legs) {
                
                const exchanges = this.bot.getExchanges()
                
                for (let index = 0; index < exchanges.length; index++) {
                    const element = exchanges[index]
                    console.log('yyy', element)
                }
                for (const property in exchanges) {
                    console.log('xxxxxxxx', property)
                    console.log('yyy', exchanges[property])
                    if (property != 'XRPL') {
                        this.exchange_selected = exchanges[property].key
                        break
                    }
                }
                this.legs = legs
                const gatehub = {
                    name: 'dex-gatehub',
                    key: 'dex-gatehub-XRPUSD',
                    base: 'XRP',
                    quote: 'USD',
                    leg: 'c'
                }
                console.log('c', 'init', gatehub.key)
                this.$store.dispatch('init', gatehub)
                const exchangeG = new XRPL(this.$store, client, 'gatehub')
                exchangeG.setMarketPair('XRP', 'USD', undefined, process.env.VUE_APP_TRUSTLINE_GATEHUB_USD)
                routes.push(gatehub)
                this.bot.addExchange(exchangeG)
                
                const bitstamp = {
                    name: 'dex-bitstamp',
                    key: 'dex-bitstamp-XRPUSD',
                    base: 'XRP',
                    quote: 'USD',
                    leg: 'c'
                }
                console.log('c', 'init', bitstamp.key)
                this.$store.dispatch('init', bitstamp)
                const exchangeB = new XRPL(this.$store, client, 'bitstamp')
                exchangeB.setMarketPair('XRP', 'USD', undefined, process.env.VUE_APP_TRUSTLINE_BITSTAMP_USD)
                routes.push(bitstamp)
                this.bot.addExchange(exchangeB)

                this.routes = routes
                await this.bot.start()

                console.log('routes', routes.length)
                
                for (let index = 0; index < routes.length; index++) {
                    const element = routes[index]
                    if (element.name != 'dex-gatehub') {
                        this.exchange_selected = element.key
                        break
                    }
                
                }

                this.startToggle()
                console.log('starting bots clicked')
            },
            async stop() {
                await this.bot.stop()
            },
            async reload() {
                await this.bot.stop()
                await this.initbot()
            },
            reloadPage() {
                window.location.reload()
            },
            async startToggle() {
                if (this.bot_status == 'stopped') {
                    if (this.bot == null) {
                        await this.initbot()
                    }
                    this.bot_status = 'started'
                }
                else {
                    await bot.stop()
                    this.bot = null
                    this.bot_status = 'stopped'
                }
            },
            CheckNetwork(network) {
                if (network) {
                    return 'one-fine-green-dot'
                } else {
                    return 'one-fine-red-dot'
                }
            }
        },
        computed: {
            xrpl_node() {
               return this.$store.getters.getNodeInfo
            },
            started() {
                if (bot == null) { return }
                return bot.hasStarted()
            }
        }
    }
</script>

<style>
body {
    overflow: auto !important;
}
.offcanvas {
    color: #000000 !important;
}
.liquidity-float {
	stroke: #FFFFFF; 
	stroke-dasharray: 2px;
    opacity: 0.4;
}

.liquidity-float-danger {
	stroke: #FF1A8B; 
}

.liquidity-float-success {
	stroke: #00e56a;
}
#app {
    color: #FFF;
}

body {
    background-color: rgb(41, 41, 41) !important;
}

.color-danger {
    color: #FF1A8B;
}
.color-success {
    color:#00e56a;
}
.color-warning {
    color: #ffc107;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
}

.btn-blue {
    background-color: #0d6efd !important;
    color: #FFF !important;
    --bs-btn-color: #fff;
    --bs-btn-bg: #0d6efd;
    --bs-btn-border-color: #0d6efd;
    --bs-btn-hover-color: #fff;
    --bs-btn-hover-bg: #0b5ed7;
    --bs-btn-hover-border-color: #0a58ca;
    --bs-btn-focus-shadow-rgb: 49, 132, 253;
    --bs-btn-active-color: #fff;
    --bs-btn-active-bg: #0a58ca;
    --bs-btn-active-border-color: #0a53be;
    --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
    --bs-btn-disabled-color: #fff;
    --bs-btn-disabled-bg: #0d6efd;

}

.btn-purple {
    background-color: #753ee2 !important;
    color: #FFF !important;
    --bs-btn-bg: #753ee2;
    --bs-btn-border-color: #753ee2;
    --bs-btn-hover-bg: #753ee2;
    --bs-btn-hover-border-color: #753ee2;
    --bs-btn-active-bg: #753ee2;
    --bs-btn-active-border-color: #753ee2;
    --bs-btn-disabled-bg: #753ee2;
    --bs-btn-disabled-border-color: #753ee2;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
}

.one-fine-dot::before {
  content: "\25cf";
}

.one-fine-red-dot::before {
  content: "\25cf";
  color: #FF1A8B;
}

.one-fine-green-dot::before {
  content: "\25cf";
  color: #00e56a;
}

.one-fine-empty-dot::before {
  content: "\25cb";
}

.lead .one-fine-dot {
  font-size: 1.5em;
}

.table-success {
    --bs-table-bg: #00e56a;
    --bs-table-striped-bg: #00e56a;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #00e56a;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #00e56a;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #00e56a;
}

.table-danger {
    --bs-table-bg: #FF1A8B;
    --bs-table-striped-bg: #FF1A8B;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #FF1A8B;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #FF1A8B;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #FF1A8B;
}

.table-success-opaque {
    --bs-table-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(0, 229, 106, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(0, 229, 106, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(0, 229, 106, 0.6);
}

.table-danger-opaque {
    --bs-table-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 26, 139, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 26, 139, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 26, 139, 0.6);
}

.table-warning-opaque {
    --bs-table-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 193, 7, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 193, 7, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 193, 7, 0.6);
}

.table-arb-opaque {
  --bs-table-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-color: #000;
  --bs-table-active-bg: rgba(116, 62, 226, 0.6);
  --bs-table-active-color: #000;
  --bs-table-hover-bg: rgba(116, 62, 226, 0.6);
  --bs-table-hover-color: #000;
  color: #FFFFFF !important;
  border-color: rgba(116, 62, 226, 0.6);
}

.table-warning-opaque {
    --bs-table-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 193, 7, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 193, 7, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 193, 7, 0.6);
}

.tip-top {
    color: #FFFFFF;
    background-color: rgba(0, 229, 106, 0.6);
}

.tip-bottom {    
    color: #FFFFFF;
    background-color: rgba(255, 26, 139, 0.6);
}

.tip-mid {    
    color: #FFFFFF;
    background-color: rgba(116, 62, 226, 0.3);
}
</style>