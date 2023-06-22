<template>
    <div class="row">
        <div class="col-2">
            <h2>{{exchangeA}}</h2>
            <div class="input-group">
                <span class="input-group-text">{{symbolA}}</span>
                <input v-model="valueA" placeholder="edit me" />
            </div>
            <br/>
            <div></div>
        </div>
        <div class="col-2">
            <br/>
            <br/>
            <h2>{{numeralFormat(valueB, '0,0[.]0000')}} XRP</h2>
            <br/>
            <ul class="list-group">
                <!-- eslint-disable-next-line -->
                <li v-for="(leg, index) in calculated_routes['b']" :class="'list-group-item ' + bestHighLight('b', index)">
                    {{leg.route}} : <span v-if="'l2' in leg">{{numeralFormat(leg['l2'].amount, '0,0[.]00000')}}</span>
                    <span v-else-if="'l1' in leg">{{numeralFormat(leg['l1'].amount, '0,0[.]00000')}}</span>
                </li>
            </ul>
            <p v-if="!fee" class="small">*route less fees</p>
            <p v-if="valueIndexB!=-1" class="small">fees: {{calculated_routes['b'][valueIndexB].trade_fees}}</p>
            
            <ul>
                <!-- eslint-disable-next-line -->
                <li v-for="(trade, index) in tradesB">
                    {{numeralFormat(trade.amount, '0,0[.]00000')}} {{numeralFormat(trade.limit_price, '0,0[.]00000')}} {{trade.base}}
                </li>
            </ul>
        </div>

        <div class="col-4">
            <!-- <div id="threejs">
                <canvas id="globe-xrpl" class="webgl" rotate="true" fiat="false" xrp="true" inner="true" stable="false"></canvas>
            </div>             -->
        </div>

        <div class="col-2">
            <br/>
            <br/>
            <h2>{{numeralFormat(valueB, '0,0[.]0000')}} XRP</h2>
            <br/>
            <ul class="list-group">
                <!-- eslint-disable-next-line -->
                <li v-for="(leg, index) in calculated_routes['a']" :class="'list-group-item ' + bestHighLight('a', index)">
                    {{leg.route}} : <span v-if="'l2' in leg">{{numeralFormat(leg['l2'].amount, '0,0[.]00000')}}</span>
                    <span v-else-if="'l1' in leg">{{numeralFormat(leg['l1'].amount, '0,0[.]00000')}}</span>
                </li>
            </ul>
            <p v-if="!fee" class="small">*route less fees</p>
            <p v-if="valueIndexC!=-1" class="small">fees: {{calculated_routes['a'][valueIndexC].trade_fees}}</p>

            <ul>
                <!-- eslint-disable-next-line -->
                <li v-for="(trade, index) in tradesA">
                    {{numeralFormat(trade.amount, '0,0[.]00000')}} {{numeralFormat(trade.limit_price, '0,0[.]00000')}} {{trade.base}}
                </li>
            </ul>
        </div>
        <div class="col-2">
            <h2>{{exchangeB}}</h2>
            <div class="input-group">
                <span class="input-group-text">{{symbolB}}</span>
                <input v-model="valueC" placeholder="edit me" disabled />
            </div>
            <br/>
            <div></div>
        </div>
    </div>
    <!-- <div class="row">
        <div class="col-12">
            <div id="threejs">
                <canvas id="globe-xrpl" class="webgl" rotate="true" fiat="false" xrp="true" inner="true" stable="false"></canvas>
            </div>            
        </div>
    </div> -->
    <div class="row">
        <div class="col-2"></div>
        <div class="col-2">
            <button type="button" class="btn btn-purple me-2" v-on:click="toggleLoop">loop</button>
            <!-- <button type="button" class="btn btn-purple me-2" v-on:click="fireTrades">trade</button> -->
        </div>
    </div>
    <br/>
    <br/>
    <br/>
    <div class="row">
        <p>FX: {{symbolA}}{{valueA}} -> {{symbolB}}{{numeralFormat(valueA / $store.getters.getFxRate, '0,0[.]0000')}} <span class="small">*route less fees</span></p>
        <p>XRPL: {{symbolA}}{{valueA}} -> {{symbolB}}{{numeralFormat(valueC, '0,0[.]0000')}} <span v-if="!fee" class="small">*route less fees</span> <span v-if="fee" class="small">*route including fees</span></p>
    </div>
</template>

<script>
    /* eslint-disable */
    // import { contextBridge, ipcRenderer } from 'electron'
    import orderBooks from './../plugin/liquidate/order-book.js'
    import getSymbolFromCurrency from 'currency-symbol-map'
    import decimal from 'decimal.js'

    export default {
        name: 'LiquidityX',
        props: ['routes', 'legs', 'fee', 'bot', 'globe'],
        data() {
            return {
                order_books: null,
                valueA: 200,
                valueB: 0,
                valueIndexB: -1,
                valueC: 0,
                valueIndexC: -1,
                tradesA: [],
                tradesB: [],
                resultsA: [],
                resultsB: [],
                calculated_routes: {},
                loop: false,
                timeout: null,
                isLoading: true
            }
        },
        created() {
            
        },
        mounted() {
            this.importGlobeToPage()
        },
        methods: {
            bestHighLight(side, index) {
                if (side == 'a' && index == this.valueIndexC) {
                    return 'active'
                }
                if (side == 'b' && index == this.valueIndexB) {
                    return 'active'
                }
                return ''
            },
            toggleLoop() {
                this.loop = !this.loop
                this.loopLiquidate()
                this.valueB = 0
                this.valueIndexB = -1
                this.valueC = 0
                this.valueIndexC = -1
            },
            loopLiquidate() {
                if (!this.loop && this.timeout != null) {
                    // clearTimeout(this.timeout)
                    // this.calculated_routes = {}
                }
                else {
                    const self = this
                    this.timeout = setTimeout(() => {
                        self.liquidate()
                    }, 500)
                }
            },
            liquidate() {
                // console.log('in here liquidate')
                // console.log('routes', this.routes)
                this.order_books = new orderBooks(this.$store)
                this.calculated_routes = this.order_books.routeCalculation(this.routes, this.legs, this.valueA, this.fee)
                
                // console.log('aasdsdsdsdss', this.calculated_routes)
                let best = {
                    value: 0,
                    index: -1,
                    trade_fees: ''
                }
                const leg1 = this.calculated_routes['b']
                leg1.forEach((element, index) => {
                    const total = ('l2' in element) ? element.l2.amount : ('l1' in element) ? element.l1.amount : 0
                    if (best.value < total * 1) {
                        best.value = total * 1
                        best.index = index
                        leg1[index].trade_fees = ('l2' in element) ? this.numeralFormat(element.l2.fee*1, '0,0[.]00000') + element.h2.base + ' ' + this.numeralFormat(element.l1.fee*1, '0,0[.]00000') + element.h1.base : ('l1' in element) ? this.numeralFormat(element.l1.fee*1, '0,0[.]00000') + element.h1.base : 0
                    }
                })
                this.valueB = best.value
                this.valueIndexB = best.index
                if (this.calculated_routes['b'][best.index] != null) {
                    if ('l1' in this.calculated_routes['b'][best.index]) {
                    this.tradesB = this.calculated_routes['b'][best.index]['l1'].trades
                    }
                    if ('l2' in this.calculated_routes['b'][best.index]) {
                        this.tradesB = this.tradesB.concat(this.calculated_routes['b'][best.index]['l2'].trades)
                    }
                }

                best = {
                    value: 0,
                    index: -1,
                    trade_fees: ''
                }
                const leg2 = this.calculated_routes['a']
                leg2.forEach((element, index) => {
                    const total = ('l2' in element) ? element.l2.amount : ('l1' in element) ? element.l1.amount : 0
                    if (best.value < total * 1) {
                        best.value = total * 1
                        best.index = index
                        leg2[index].trade_fees = ('l2' in element) ? this.numeralFormat(element.l2.fee*1, '0,0[.]00000') + element.h2.quote + ' ' + this.numeralFormat(element.l1.fee*1, '0,0[.]00000') + element.h1.quote: ('l1' in element) ? this.numeralFormat(element.l1.fee*1, '0,0[.]00000') + element.h1.quote: 0
                    }
                })
                this.valueC = best.value
                this.valueIndexC = best.index

                if (this.calculated_routes['b'][best.index] != null) {
                    if ('l1' in this.calculated_routes['a'][best.index]) {
                        this.tradesA = this.calculated_routes['a'][best.index]['l1'].trades
                    }
                    if ('l2' in this.calculated_routes['a'][best.index]) {
                        this.tradesA = this.tradesA.concat(this.calculated_routes['a'][best.index]['l2'].trades)
                    }
                }
                
                this.loopLiquidate()
            },
            async trade(trade) {
                const exchanges = this.bot.getExchanges()
                const sell = (trade.trades[0].side == 'sell') ? true: false

                console.log('this.routes', this.routes)
                let market_data = null
                this.routes.forEach(route => {
                    if (route.key == trade.book) {
                        market_data = route.market_data
                    }
                })
                if (market_data == null) { 
                    console.error('could not find market data for book', trade.book)
                    return false 
                }
                console.log('market_data', market_data)
                const amount = (sell) ? new decimal(trade.amount_liquidated.amount).toFixed(market_data.lot_decimals) : new decimal(trade.amount).toFixed(market_data.lot_decimals)
                const inverse_amount = (sell) ? new decimal(trade.amount).toFixed(market_data.lot_decimals) : new decimal(trade.amount_liquidated.amount).toFixed(market_data.lot_decimals)
                
                //lot_decimals
                for (let index = 0; index < exchanges.length; index++) {
                    const exchange = exchanges[index]
                    if (exchange.getKey() == trade.book) {
                        //change to true for testing, last param!!!
                        return await exchange.placeMarketOrder(amount, sell, inverse_amount, false)
                    }
                }
            },
            validateRouteMin(trade) {
                if ('l1' in trade) {
                    if (!trade['l1']['amount_liquidated']['liquidated'])  {
                        console.error('trade note fully liquidated', trade['l1'])
                        return false
                    }
                    if (trade['l1']['amount_liquidated']['ordermin_base'] == trade['l1']['currency']) {
                        if (new decimal(trade['l1']['amount_liquidated']['order_min']).greaterThanOrEqualTo(trade['l1']['amount']))  {
                            console.error('minimum trade amount not met', trade['l1'])
                            return false 
                        }   
                    }
                    if (trade['l1']['amount_liquidated']['ordermin_base'] == trade['l1']['amount_liquidated']['currency']) {
                        if (new decimal(trade['l1']['amount_liquidated']['order_min']).greaterThanOrEqualTo(trade['l1']['amount_liquidated']['amount']))  {
                            console.error('minimum trade amount not met', trade['l1'])
                            return false 
                        }
                    }
                }
                if ('l2' in trade) {
                    if (!trade['l2']['amount_liquidated']['liquidated'])  {
                        console.error('trade note fully liquidated', trade['l2'])
                        return false 
                    }
                    if (trade['l2']['amount_liquidated']['ordermin_base'] == trade['l2']['currency']) {
                        if (new decimal(trade['l1']['amount_liquidated']['order_min']).greaterThanOrEqualTo(trade['l2']['amount']))  {
                            console.error('minimum trade amount not met', trade['l2'])
                            return false 
                        }   
                    }
                    if (trade['l2']['amount_liquidated']['ordermin_base'] == trade['l2']['amount_liquidated']['currency']) {
                        if (new decimal(trade['l2']['amount_liquidated']['order_min']).greaterThanOrEqualTo(trade['l2']['amount_liquidated']['amount']))  {
                            console.error('minimum trade amount not met', trade['l2'])
                            return false 
                        }
                    }
                }
                return true
            },
            async fireTrades() {     
                if (this.calculated_routes['a'][this.valueIndexC] == null) { return }
                if (this.calculated_routes['b'][this.valueIndexB] == null) { return }

                const tradeA = this.calculated_routes['a'][this.valueIndexC]
                const tradeB = this.calculated_routes['b'][this.valueIndexB]

                // do validations here before firing trades.
                if (!this.validateRouteMin(tradeA)) { return }
                if (!this.validateRouteMin(tradeB)) { return }


                // firing trades.
                console.log('tradeB', tradeB)
                if ('l1' in tradeB) {
                    console.log('l1', tradeB['l1'])
                    await this.trade(tradeB['l1'])
                }
                if ('l2' in tradeB) {
                    console.log('l2', tradeB['l2'])
                    await this.trade(tradeB['l2'])
                }

                console.log('tradesA')
                if ('l1' in tradeA) {
                    console.log('l1', tradeA['l1'])
                    await this.trade(tradeA['l1'])
                }
                if ('l2' in tradeA) {
                    console.log('l2', tradeA['l2'])
                    await this.trade(tradeA['l2'])
                }
            },
            removeGlobeFromPage() {
                const element = document.getElementById('globe-xrpl')
                element.parentNode.removeChild(element)

                const parentNode = document.getElementById('threejs')
                const canvas = document.createElement('canvas')
                canvas.id = 'globe-xrpl'
                parentNode.appendChild(canvas)

                
                // const element2 = document.getElementById('globeScript')
                // element2.parentNode.removeChild(element2)

                console.log('globe removed')
            },
            importGlobeToPage() {
                console.log('adding globeScript')
                let globe_params = document.getElementById('globe-xrpl')

                globe_params.setAttribute('rotate', 'true')
                globe_params.setAttribute('inner', 'true')
                globe_params.setAttribute('fiat', 'false')
                globe_params.setAttribute('xrp', 'true')
                globe_params.setAttribute('stable', 'false')
                globe_params.setAttribute('zoom', 'false')
                globe_params.classList.add('contained')

                if (this.isLoading) {
                    this.isLoading = false
                    let externalScript = document.createElement('script')
                    externalScript.setAttribute('src', './bundle.3c8e8d20d15471db70fa.js')
                    externalScript.id = 'globeScript'
                    
                    document.head.appendChild(externalScript)
                }
                
                console.log('globeScript added')
            },
        },
        computed: {
            exchangeA() {
                for (let index = 0; index < this.routes.length; index++) {
                    if (this.routes[index].leg == 'b') {
                        return this.routes[index].name
                    }
                }
                return '-'
            },
            exchangeB() {
                for (let index = 0; index < this.routes.length; index++) {
                    if (this.routes[index].leg == 'a') {
                        return this.routes[index].name
                    }
                }
                return '-'
            },
            symbolA() {
                return getSymbolFromCurrency(this.$store.getters.getFxPair.substring(3, 6))
            },
            symbolB() {
                return getSymbolFromCurrency(this.$store.getters.getFxPair.substring(0, 3))
            }
        },
        watch: {
            globe() {
                if (!this.globe) {
                    this.removeGlobeFromPage()
                }
                else {
                    this.importGlobeToPage()
                }
            }
        }
    }
</script>

<style scoped>
input:disabled {
    color: -internal-light-dark(rgb(84, 84, 84), rgb(170, 170, 170));
    cursor: default;
    background-color: rgba(255, 255, 255, 0.64) !important;
    border-color: rgba(118, 118, 118, 0.6) !important;
}
.table {
    color: #FFFFFF;
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

.color-danger {
    color: #FF1A8B;
}
.color-success {
    color:#00e56a;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
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
</style>