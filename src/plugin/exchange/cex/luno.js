'use strict'

import Cex from './cex.js'
// import ccxt from 'ccxt'
import axios from 'axios'
import qs from 'qs'
import currencies from './../../currencies.js'
import decimal from 'decimal.js'

class Luno extends Cex {

    constructor($store) {
        super($store)

        this.setName('luno')

        // this.ccxt = new ccxt.luno({
        //     apiKey: process.env.VUE_APP_LUNO_APIKEY,
        //     secret: process.env.VUE_APP_LUNO_SECRETKEY
        // })

        this.connection.public.uri = null
        this.connection.private.uri = null
        this.book_synced = true
        this.sequence = 0
        this.last = null
        this.ready = false
        this.asset_pairs = null

        Object.assign(this, {
            setMarketPair(quote, base) {
                // if (!this.getAvailablePairs().includes(market_code)) {
                //     throw new Error(`${market_code} is not available for ${this.getName()}`)
                // }
                this.setMarketCode(quote, base)
                this.connection.public.uri = 'wss://ws.luno.com/api/1/stream/' + this.getMarketCode()
                this.connection.private.uri = 'wss://ws.luno.com/api/1/userstream'

                this.ready = true
            },
            getFiatPairs() {
                const world = currencies.world()
                const data = this.asset_pairs

                const fiat = {}
                for (let index = 0; index < world.length; index++) {
                    const element = world[index]
                    for (let j = 0; j < data.markets.length; j++) {
                        if (data.markets[j].counter_currency == element.code) {
                            fiat[element.code] = element.code
                        }
                    }
                }
                console.log('fiat', fiat)
                return fiat
            },
            getFiatPairsBaseXRP() {
                const world = currencies.world()
                const data = this.asset_pairs

                const fiat = {}
                for (let index = 0; index < world.length; index++) {
                    const element = world[index]
                    for (let j = 0; j < data.markets.length; j++) {
                        if (data.markets[j].counter_currency == element.code && data.markets[j].base_currency == 'XRP') {
                            fiat[element.code] = element.code
                        }
                    }
                }
                console.log('fiat', fiat)
                return fiat
            },
            getIntervals() {
                return [
                    { label: '1 min', value: 60},
                    { label: '5 min', value: 300},
                    { label: '15 min', value: 900},
                    { label: '30 min', value: 1800},
                    { label: '1 hour', value: 3600},
                    { label: '3 hour', value: 10800},
                    { label: '4 hour', value: 14400},
                    { label: '8 hours', value: 28800},
                    { label: '1 day', value: 86400},
                    { label: '3 day', value: 259200},
                ]
            },
            async getOHCL(pair, interval = 3600) {

                const httpOptions = {
                    auth: {
                        username: $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                        password: $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                    }
                }
                try {
                    const {data} = await axios.get(`https://api.luno.com/api/exchange/1/candles?pair=${pair}&since=1470810728478&duration=${interval}`, httpOptions)
                    const ohlc = []
                    for (let index = 0; index < data.candles.length; index++) {
                        const element = data.candles[index]
                        ohlc.push([element.timestamp/1000, element.open, element.high, element.low, element.close, 0, element.volume, 0])
                    }

                    const payload = {}
                    payload.key = this.getKey()
                    payload.interval = interval
                    payload.value = ohlc
                    $store.dispatch('updateOHLCExchange', payload)

                    return ohlc
                }
                catch (e) {
                    console.error('error', e)
                    return {}
                }
            },
            hasChart() {
                return true
            },
            async getMarketsData() {
                let structured = {}

                try {
                    const {data} = await axios.get('https://api.luno.com/api/exchange/1/markets')
                    this.asset_pairs = data

                    console.log('structured', structured)


                    for (let index = 0; index < data.markets.length; index++) {
                        const element = data.markets[index]
                        structured[element.base_currency + element.counter_currency] = {
                            exchange: this.getName(),
                            market: element.base_currency + element.counter_currency,
                            base: element.base_currency,
                            quote: element.counter_currency,
                            active: (element.trading_status == 'ACTIVE') ? true: false,
                            trade_fee: '0.1', //'0.10%'
                            ordermin: element.min_volume,
                            ordermin_base: element.base_currency,
                            lot_decimals: element.volume_scale,
                            pair_decimals: element.price_scale,
                            // initial: element.market_id,
                            // initial_data: element
                        }
                    }
                    this.setAvailablePairs(structured)
    
                    return structured
                }
                catch (e) {
                    console.error('error', e)
                    return {}
                }
            },
            async init() {
                if (this.ready == false) { return }
                this.connection.public.subscriptions.push({
                    'api_key_id': $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                    'api_key_secret': $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                })
                this.connection.private.subscriptions.push({
                    'api_key_id': $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                    'api_key_secret': $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                })

                console.log(`openSockets ${this.getName()}`)
                this.book_synced = true
                this.openSockets()
                this.socketResponses()
                this.updateBalances()
            },
            socketResponses() {
                const self = this
                let first = true

                this.connection.public.socket.onmessage = async function (event) {
                    self.connection.public.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    const message = JSON.parse(event.data)

                    // console.log('xxxxx', self.getKey())
                    // console.log('event', event)
                    
                    // console.log('message', message)
                    if (!self.getStarted()) { 
                        console.log('not started......')
                        return 
                    }
                    // if (!self.book_synced && self.getStarted()) {
                    //     console.log('firing restart!')
                    //     self.restart()
                    //     return
                    // }

                    if (typeof message !== 'object') { 
                        // console.error('invalid data', event)
                        return 
                    }
                    if (first && 'asks' in message && 'bids' in message && 'sequence' in message) {
                        first = false
                        self.sequence = message.sequence*1
                        self.apiInitBook(message)
                        return
                    } else if (typeof message === 'object' && 'sequence' in message) {
                        self.apiUpdateBook(message)
                        return
                    }
                    console.log('missing type', message)
                    
                }
                this.connection.private.socket.onmessage = function (event) {
                    self.connection.private.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    console.log('private message 123', event)
                    const message =  JSON.parse(event.data)
                    switch (message.type) { 
                        case 'balance_update': {
                            // here we update our balances
                            console.log('balance_update', message)
                            break
                        }
                        case 'order_status': {
                            // here we update our orders
                            // - orders added come through here
                            console.log('order_status', message)
                            break
                        }
                        case 'order_fill': {
                            // here orders are filled
                            console.log('order_fill', message)
                            break
                        }
                        default: {
                            console.log('missing type', message)
                        }
                    }
                }
            },
            apiUpdateBook(data) {
                this.sequence++
                if (this.sequence != data.sequence*1) {
                    console.error(`sequence mismatch ${this.getKey()}`, this.sequence, data.sequence)
                    this.book_synced = false
                    this.restart()
                }
                
                if ('delete_update' in data && data.delete_update != null) {
                    const side = (this.book_offers['bids'][data.delete_update.order_id] == undefined) ? 'asks' : 'bids'
                    // console.log(`del ${this.getKey()}`, data.delete_update)
                    delete this.book_offers[side][data.delete_update.order_id]
                    // delete this.book_offers['bids'][data.delete_update.order_id]
                }

                if ('create_update' in data && data.create_update != null) {
                    const side = (data.create_update.type == 'ASK') ? 'asks' : 'bids'

                    const row = {
                        amount: data.create_update.volume * 1, 
                        limit_price: data.create_update.price
                    }
                        
                    this.book_offers[side][data.create_update.order_id] = row
                }
                if ('trade_updates' in data && data.trade_updates != null) {
                    for (let index = 0; index < data.trade_updates.length; index++) {
                        const trade = data.trade_updates[index]
                        const side = (this.book_offers['bids'][trade.maker_order_id] == undefined) ? 'asks' : 'bids'

                        const history = $store.getters.getHistoryExchange(this.getKey())
                        const last = (history.length > 0) ? history[0] : 0
                        $store.dispatch('pushHistoryExchange', { key: this.getKey(), order: {
                            quote: this.getQuoteCurrency(),
                            base: this.getBaseCurrency(),
                            amount: trade.base*1,
                            limit_price: this.book_offers[side][trade.maker_order_id].limit_price,
                            timestamp: new Date().getTime(),
                            exchange: this.getName(),
                            side: side == 'asks' ? 'buy' : 'sell',
                            color: ((trade.base*1) > last.limit_price) ? 'buy' : 'sell'
                        }})

                        this.book_offers[side][trade.maker_order_id]['amount'] = new decimal(this.book_offers[side][trade.maker_order_id]['amount']).minus(trade.base).toFixed(8)
                        
                        if (this.book_offers[side][trade.maker_order_id]['amount']*1 <= 0) {
                            delete this.book_offers[side][trade.maker_order_id]
                        }
                    }
                } else {
                    console.log('unknown message', data)
                    return
                }

                // this one we need to squash that book
                
                this.squashBook()
            },
            apiInitBook(data) {
                this.book_offers = {
                    asks: {},
                    bids: {}
                }
                for (const ask of data.asks) {
                    const row = {
                        amount: ask.volume*1, 
                        limit_price: ask.price
                    }
                    this.book_offers['asks'][ask.id] = row
                }
                for (const bid of data.bids) {
                    const row = {
                        amount: bid.volume*1, 
                        limit_price: bid.price
                    }
                    this.book_offers['bids'][bid.id] = row
                }
                
                // this one we need to squash that book
                // this.squashBook()
            },
            squashBook() {
                const data_set = {
                    asks: {},
                    bids: {}
                }
                const asks = Object.values(this.book_offers.asks)
                for (let index = 0; index < asks.length; index++) {
                    const ask = asks[index]
                    if (data_set['asks'][ask.limit_price] === undefined) {
                        data_set['asks'][ask.limit_price] = {
                            amount: ask.amount*1, 
                            limit_price: ask.limit_price
                        }
                    }
                    else {
                        data_set['asks'][ask.limit_price]['amount'] += ask.amount*1 //  new decimal(data_set['asks'][ask.limit_price]['amount']).plus(ask.amount).toFixed(8)
                    }
                }


                const bids = Object.values(this.book_offers.bids)
                for (let index = 0; index < bids.length; index++) {
                    const bid = bids[index]
                    if (data_set['bids'][bid.limit_price] === undefined) {
                        data_set['bids'][bid.limit_price] = {
                            amount: bid.amount*1, 
                            limit_price: bid.limit_price
                        }
                    }
                    else {
                        data_set['bids'][bid.limit_price]['amount'] +=  bid.amount*1 //new decimal(data_set['bids'][bid.limit_price]['amount']).plus(bid.amount).toFixed(8)
                    }
                }

                // console.log('values end', data_set)
                const payload = {}
                payload.offers = data_set
                payload.key = this.getKey()

                // console.log('squashBook')
                $store.dispatch('updateBookExchange', payload)
            },
            // eslint-disable-next-line
            async placeMarketOrder(amount, sell, inverse_amount, test = true) {
                console.log(`${this.getKey()} placing order`, {marketCode: this.getMarketCode(), amount: amount, sell: sell})

                const type = (sell) ? 'SELL':'BUY'
                const privatePath = '/api/1/'
                const endPointName = 'marketorder'
                const apiEndpointFullURL = 'https://api.luno.com' + privatePath + endPointName
                
                const time = new Date().getTime()
                const apiPostBodyData =  ''
                const params = {
                    pair: this.getMarketCode(),
                    type: type,
                    timestamp: time
                }
                if (sell) {
                    params['base_volume'] = amount
                }
                else {
                    params['counter_volume'] = inverse_amount
                }

                const httpOptions = {
                    auth: {
                        username: $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                        password: $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                    }
                }
                try {
                    console.log('luno post', apiEndpointFullURL + '?' + qs.stringify(params), apiPostBodyData, httpOptions)
                    if (test) { return }
                    const {data} = await axios.post(apiEndpointFullURL + '?' + qs.stringify(params), apiPostBodyData, httpOptions)
                    console.log('result', data)
                    return true
                } catch (e) {
                    console.error(`${this.getKey()} failed to post market order`)
                    console.error(e)
                }

                return false
            },
            async updateBalances() {
                console.log(`${this.getKey()} getting balances`)
                const privatePath = '/api/1/'
                const endPointName = 'balance'
                const apiEndpointFullURL = 'https://api.luno.com' + privatePath + endPointName

                const httpOptions = {
                    auth: {
                        username: $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                        password: $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                    }
                }
                try {
                    const {data} = await axios.get(apiEndpointFullURL, httpOptions)
                    console.log('result', data)
                    if (!('balance' in data)) { return false }
                    const balances = {}
                    for (let index = 0; index < data.balance.length; index++) {
                        const element = data.balance[index]
                        balances[element.asset] = element.balance
                    }
                    console.log('luno balances', balances)
                    const payload = {}
                    payload.value = balances
                    payload.key = this.getKey()
                    $store.dispatch('updateBalances', payload)

                    return true
                } catch (e) {
                    console.error(`${this.getKey()} failed to fetch balances`)
                    console.error(e)
                }

                return false
            },
            async sendXRP(wallet = 'rThREeXrp54XTQueDowPV1RxmkEAGUmg8') {
                console.log('send XRP....')
                const privatePath = '/api/1/'
                const endPointName = 'send'
                const apiEndpointFullURL = 'https://api.luno.com' + privatePath + endPointName
                const apiPostBodyData =  ''
                const params = {
                    amount: '1631',
                    currency: 'XRP',
                    address: wallet
                }

                const httpOptions = {
                    auth: {
                        username: $store.getters.getAccess?.keys?.VUE_APP_LUNO_APIKEY,
                        password: $store.getters.getAccess?.keys?.VUE_APP_LUNO_SECRETKEY
                    }
                }
                try {
                    console.log('luno post', apiEndpointFullURL + '?' + qs.stringify(params), apiPostBodyData, httpOptions)
                    const {data} = await axios.post(apiEndpointFullURL + '?' + qs.stringify(params), apiPostBodyData, httpOptions)
                    console.log('result', data)
                    return true
                } catch (e) {
                    console.error(`${this.getKey()} failed to post send XRP request`)
                    console.error(e)
                }

                return false
            }
        })
    }
}

export default Luno