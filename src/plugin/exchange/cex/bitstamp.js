'use strict'

import Cex from './cex.js'

// import ccxt from 'ccxt'
import axios from 'axios'
import crypto from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import qs from 'qs'
import currencies from './../../currencies.js'

class Bitstamp extends Cex {
    constructor($store) {
        super($store)

        this.setName('bitstamp')
        
        // this.ccxt = new ccxt.bitstamp({
        //     apiKey: process.env.VUE_APP_BITSTAMP_APIKEY,
        //     secret: process.env.VUE_APP_BITSTAMP_SECRETKEY,
        //     uid: process.env.VUE_APP_BITSTAMP_USER_ID
        // })
        
        this.connection.public.uri = 'wss://ws.bitstamp.net'
        this.connection.private.uri = 'wss://ws.bitstamp.net'

        this.private_market_code = null
        this.ready = false
        this.asset_pairs = null

        Object.assign(this, {
            setMarketPair(quote, base) {
                // if (!this.getAvailablePairs().includes(market_code)) {
                //     throw new Error(`${market_code} is not available for ${this.getName()}`)
                // }
                this.setMarketCode(quote, base)
                this.private_market_code = this.getMarketCode().toLowerCase()
                this.ready = true
            },
            getFiatPairs() {
                const world = currencies.world()
                const data = this.asset_pairs
                
                const fiat = {}
                for (let index = 0; index < world.length; index++) {
                    const element = world[index]
                    for (let j = 0; j < data.length; j++) {
                        if (data[j].name.split('/')[1] == element.code) {
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
                    for (let j = 0; j < data.length; j++) {
                        if (data[j].name.split('/')[1] == element.code && data[j].name.split('/')[0] == 'XRP') {
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
                    { label: '3 min', value: 180},
                    { label: '5 min', value: 300},
                    { label: '15 min', value: 900},
                    { label: '30 min', value: 1800},
                    { label: '1 hour', value: 3600},
                    { label: '2 hour', value: 7200},
                    { label: '4 hour', value: 14400},
                    { label: '6 hour', value: 21600},
                    { label: '12 hour', value: 43200},
                    { label: '1 day', value: 86400},
                    { label: '3 day', value: 259200},
                ]
            },
            async getOHCL(pair, interval = 3600) {
                try {
                    const {data} = await axios.get(`https://www.bitstamp.net/api/v2/ohlc/${pair.toLowerCase()}/?step=${interval}&limit=1000`)
                    const ohlc = []
                    for (let index = 0; index < data.data.ohlc.length; index++) {
                        const element = data.data.ohlc[index]
                        ohlc.push([element.timestamp*1, element.open, element.high, element.low, element.close, 0, element.volume, 0])
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
                    const {data} = await axios.get('https://www.bitstamp.net/api/v2/trading-pairs-info/')
                    this.asset_pairs = data

                    for (let index = 0; index < data.length; index++) {
                        const element = data[index]
                        structured[element.name.split('/')[0] + element.name.split('/')[1]] = {
                            exchange: this.getName(),
                            market: element.name.split('/')[0] + element.name.split('/')[1],
                            base: element.name.split('/')[0],
                            quote: element.name.split('/')[1],
                            active: (element.trading == 'Enabled') ? true: false,
                            trade_fee: '0.4', //'0.40%'
                            ordermin: element.minimum_order.split(' ')[0],
                            ordermin_base: element.minimum_order.split(' ')[1],
                            lot_decimals: element.base_decimals,
                            pair_decimals: element.counter_decimals,
                            initial: element.name,
                            initial_data: element
                        }
                    }
                    console.log('structured', structured)
                }
                catch (e) {
                    console.error('error', e)
                }

                return structured
            },
            generateSignature(nonce) {
                const hash = crypto.createHmac('sha256', $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_SECRETKEY)
                .update(nonce + $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_USER_ID + $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_APIKEY)
                .digest('hex')
            
                return hash.toUpperCase()
            },
            async getToken() {
                const nonce = new Date().getTime()
                const params = {
                    key: $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_APIKEY,
                    signature: this.generateSignature(nonce),
                    nonce: nonce
                }
                const token_request = axios.create({
                    baseURL: 'https://www.bitstamp.net/api/v2/',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                })
                try {
                    const {data} = await token_request.post('websockets_token/', qs.stringify(params))
                    if ('token' in data) {
                        this.token = data.token
                        this.uid = data.user_id
                        return true
                    }
                    console.error(`${this.getKey()} no token found`)
                } catch (e) {
                    console.error(`${this.getKey()} failed to fetch token`)
                    this.restart()
                    return false
                }
                return false
            },
            async init() {
                if (this.ready == false) { return }
                if (!(await this.getToken())) { return }
                this.connection.public.subscriptions.push({ 
                    'event': 'bts:subscribe', 
                    'data': { 
                        'channel': 'order_book_' + this.private_market_code
                    }
                })
                this.connection.public.subscriptions.push({ 
                    'event': 'bts:subscribe', 
                    'data': { 
                        'channel': 'live_trades_' + this.private_market_code 
                    }
                })
                
                this.connection.private.subscriptions.push({ 
                    'event': 'bts:subscribe', 
                    'data': { 
                        'channel': 'private-my_orders_' + this.private_market_code + '-' + this.uid, 
                        'auth': this.token 
                    } 
                })
                this.connection.private.subscriptions.push({ 
                    'event': 'bts:subscribe', 
                    'data': { 
                        'channel': 'private-my_trades_' + this.private_market_code + '-' + this.uid, 
                        'auth': this.token 
                    } 
                })

                console.log(`openSockets ${this.getName()}`, this.token)
                this.openSockets()
                this.socketResponses()
                this.updateBalances()
            },
            socketResponses() {
                const self = this
                this.connection.public.socket.onmessage = function (event) {
                    self.connection.public.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    
                    // console.log('yyyyy', self.getKey())
                    const message = JSON.parse(event.data)
                    switch (message.event) {
                        case 'data': {
                            if (message.channel == 'order_book_' + self.private_market_code) {
                                // update store orderbook
                                const data = self.mutateData(message.data)
                                const payload = {}
                                payload.offers = data
                                payload.key = self.getKey()
                                $store.dispatch('updateBookExchange', payload)
                            }
                            break
                        }
                        case 'trade': {
                            const history = $store.getters.getHistoryExchange(self.getKey())
                            const last = (history.length > 0) ? history[0] : 0

                            $store.dispatch('pushHistoryExchange', { key: self.getKey(), order: {
                                id: message.data.id,
                                quote: self.getQuoteCurrency(),
                                base: self.getBaseCurrency(),
                                amount: message.data.amount*1,
                                limit_price: message.data.price,
                                timestamp: new Date(message.data.timestamp * 1000).getTime(),
                                exchange: self.getName(),
                                side: (message.data.type == 0) ? 'buy' : 'sell',
                                color: (message.data.price > last.limit_price) ? 'buy' : 'sell'
                            }})

                            break
                        }
                            
                        case 'bts:subscription_succeeded': {
                            //console.log('subscription_succeeded', message)
                            break
                        }
                            
                        default: {
                            console.log('missing switch', message.event)
                        }
                    }
                },
                this.connection.private.socket.onmessage = function (event) {
                    self.connection.private.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                
                    //console.log('message', event)
                    const message =  JSON.parse(event.data)

                    switch (message.event) {
                        case 'data': {
                            console.log('message', message)
                            break
                        }   
                        case 'trade': {
                            console.log('trade', message)
                            break
                        }
                        case 'order_created': {
                            console.log('order_created', message)
                            break
                        }
                        case 'bts:subscription_succeeded': {
                            //console.log('subscription_succeeded', message)
                            break
                        }   
                        case 'bts:error': {
                            console.warn('message', message)
                            break
                        }
                        default: {
                            console.log('missing switch', message.event)
                        }
                    }
                }
            },
            mutateData(data) {
                const results = {
                    bids: {},
                    asks: {}
                }

                for (let index = 0; index < data.bids.length; index++) {
                    const price = data.bids[index][0] * 1
                    const volume = data.bids[index][1] * 1
                    results.bids[price] = {
                        amount: volume,
                        limit_price: price,
                        quality: volume/price
                    }
                }
    
                for (let index = 0; index < data.asks.length; index++) {
                    const price = data.asks[index][0] * 1
                    const volume = data.asks[index][1] * 1
                    results.asks[price] = {
                        amount: volume,
                        limit_price: price,
                        quality: volume/price
                    }
                }
                return results
            },
            // eslint-disable-next-line
            async placeMarketOrder(amount, sell, inverse_amount, test = true) {
                console.log(`${this.getKey()} placing order`, {marketCode: this.getMarketCode(), amount: amount, sell: sell})
                // https://www.bitstamp.net/api/v2/buy/market/{currency_pair}/

                const type = (sell) ? 'sell':'buy'
                const privatePath = '/api/v2/'
                const endPointName = `${type}/market/${this.private_market_code}/`
                const apiEndpointFullURL = 'https://www.bitstamp.net' + privatePath + endPointName
                const nonce = cryptoRandomString(36)
                const time = new Date().getTime()
                const apiPostBodyData =  qs.stringify({
                    amount: amount
                })

                const signature = this.generateSignature2(nonce, time, 'www.bitstamp.net' + privatePath + endPointName, apiPostBodyData)

                

                const httpOptions = {
                    headers: {
                        'X-Auth': 'BITSTAMP ' + $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_APIKEY,
                        'X-Auth-Signature': signature,
                        'X-Auth-Nonce': nonce,
                        'X-Auth-Timestamp': time,
                        'X-Auth-Version': 'v2',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
                try {
                    console.log('bitstamp post', apiEndpointFullURL, apiPostBodyData, httpOptions)
                    if (test) { return }
                    const {data} = await axios.post(apiEndpointFullURL, apiPostBodyData, httpOptions)
                    console.log('result', data)
                    return true
                } catch (e) {
                    console.error(`${this.getKey()} failed to post market order`)
                    console.error(e)
                }

                return false
            },
            generateSignature2(nonce, timestamp, apiEndpointFullURL, payloadString, contentType = true) {
                const hash = crypto.createHmac('sha256', $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_SECRETKEY)
                .update('BITSTAMP ' + $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_APIKEY 
                    + 'POST' + apiEndpointFullURL
                    + (contentType ? 'application/x-www-form-urlencoded' : '') + nonce 
                    + timestamp + 'v2' + payloadString).digest('hex')
            
                return hash.toUpperCase()
            },
            async updateBalances() {
                console.log(`${this.getKey()} getting balances`)
                // https://www.bitstamp.net/api/v2/balance/

                const privatePath = '/api/v2/'
                const endPointName = `balance/`
                const apiEndpointFullURL = 'https://www.bitstamp.net' + privatePath + endPointName
                const nonce = cryptoRandomString(36)
                const time = new Date().getTime()
                const apiPostBodyData = ''
                const signature = this.generateSignature2(nonce, time, 'www.bitstamp.net' + privatePath + endPointName, apiPostBodyData, false)               

                const httpOptions = {
                    headers: {
                        'X-Auth': 'BITSTAMP ' + $store.getters.getAccess?.keys?.VUE_APP_BITSTAMP_APIKEY,
                        'X-Auth-Signature': signature,
                        'X-Auth-Nonce': nonce,
                        'X-Auth-Timestamp': time,
                        'X-Auth-Version': 'v2'
                    },
                    transformRequest: (data, headers) => {
                        delete headers.post['Content-Type']
                    },
                }
                try {
                    const {data} = await axios.post(apiEndpointFullURL, apiPostBodyData, httpOptions)
                    const balances = {}
                    for (const property in data) {
                        if (property.split('_')[1] != 'available') { continue }
                        if (property.split('_')[0] != this.getBaseCurrency().toLowerCase() && property.split('_')[0] != this.getQuoteCurrency().toLowerCase()) { continue }
                        
                        balances[property.split('_')[0].toUpperCase()] = data[property]
                    }
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
            }
        })
    }
}

export default Bitstamp