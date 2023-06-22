'use strict'

import Cex from './cex.js'

// import ccxt from 'ccxt'

import axios from 'axios'
import crypto from 'crypto'

class Cryptocom extends Cex {

    constructor($store) {
        super($store)

        this.setName('cryptocom')

        // this.ccxt = new ccxt.cryptocom({
        //     apiKey: process.env.VUE_APP_CRYPTOCOM_APIKEY,
        //     secret: process.env.VUE_APP_CRYPTOCOM_SECRETKEY
        // })

        this.connection.public.uri = 'wss://stream.crypto.com/v2/market'
        this.connection.private.uri = 'wss://stream.crypto.com/v2/user'

        this.private_market_code = null
        this.ready = false

        Object.assign(this, {
            setMarketPair(market_code) {
                // if (!this.getAvailablePairs().includes(market_code)) {
                //     throw new Error(`${market_code} is not available for ${this.getName()}`)
                // }
                this.setMarketCode(market_code)
                this.private_market_code = this.getBaseCurrency() + '_' + this.getQuoteCurrency()
                this.ready = true
            },
            async getMarketPairs() {
                try {
                    const {data} = await axios.get('https://api.crypto.com/v2/public/get-instruments')

                    this.setAvailablePairs([
                        'XRPUSDT',
                        'XRPUSDC',
                        'XRPBTC',
                        'XRPETH',
                        'BTCUSDT',
                        'BTCUSDC',
                        'ETHUSDT',
                        'ETHUSDC'
                    ])
                    return data
                } catch(e) {
                    return 
                }
            },
            async init() {
                if (this.ready == false) { return }
                const login_request = {
                    'id': 1,
                    'api_key': process.env.VUE_APP_CRYPTOCOM_APIKEY,
                    'method': 'public/auth',
                    'nonce': new Date().getTime()
                }
                const apiKey = process.env.VUE_APP_CRYPTOCOM_APIKEY
                const apiSecret = process.env.VUE_APP_CRYPTOCOM_SECRETKEY

                const login_signed = this.signRequest(login_request, apiKey, apiSecret)
                this.connection.private.subscriptions.push(login_signed)
                this.connection.public.subscriptions.push({
                    'id': 5,
                    'method': 'subscribe',
                    'params': {
                      'channels': ['book.' + this.private_market_code + '.50']
                    },
                    'nonce': new Date().getTime()
                })
                this.connection.public.subscriptions.push({
                    'id': 6,
                    'method': 'subscribe',
                    'params': {
                      'channels': ['trade.' + this.private_market_code]
                    },
                    'nonce': new Date().getTime()
                })
                this.connection.private.subscriptions.push({
                    'id': 2,
                    'method': 'subscribe',
                    'params': {
                        'channels': ['user.order.' + this.private_market_code]
                    },
                    'nonce': new Date().getTime()
                })
                this.connection.private.subscriptions.push({
                    'id': 2,
                    'method': 'subscribe',
                    'params': {
                        'channels': ['user.order.' + this.private_market_code]
                    },
                    'nonce': new Date().getTime()
                })

                console.log(`openSockets ${this.getName()}`)
                this.openSockets()
                this.socketResponses()
            },
            subscribePause(milliseconds = 1000) {
                return new Promise(resolve => {
                    setTimeout(resolve, milliseconds);
                })
            },
            signRequest(request, api_key, secret) {
                const { id, method, params, nonce } = request
                const paramsString = params == null ? '' : Object.keys(params).sort().reduce((a, b) => a + b + params[b], '')
                const sigPayload = method + id + api_key + paramsString + nonce
                // console.log('sigPayload', sigPayload)
                
                const hash = crypto.createHmac('sha256', secret)
                  .update(sigPayload)
                  .digest('hex')

                request.sig = hash
                return request
            },
            socketResponses() {
                const self = this
                
                this.connection.public.socket.onmessage = function (event) {
                    self.connection.public.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    const message = JSON.parse(event.data)

                    if ('method' in message && message.method == 'public/heartbeat') {
                        let heartbeat_request = {
                            'id': message.id,
                            'method': 'public/respond-heartbeat'
                        }
                        // console.log('heartbeat_request', heartbeat_request)
                        self.connection.public.socket.send(JSON.stringify(heartbeat_request))
                        return
                    }

                    if (!('result' in message && 'channel' in message.result)) { 
                        console.log('message', message)
                        return 
                    }

                    switch (message.result.channel) {
                        case 'book': {
                            // console.log('message', message)
                            const data = self.mutateData(message.result.data[0])
                            const payload = {}
                            payload.offers = data
                            payload.key = self.getKey()
                            $store.dispatch('updateBookExchange', payload)
                            break
                        }
                            
                        case 'trade': {
                            // console.log('trade', message)
                            for (let index = 0; index < message.result.data.length; index++) {
                                const element = message.result.data[index]
                                const history = $store.getters.getHistoryExchange(self.getKey())
                                const last = (history.length > 0) ? history[0] : 0
                                $store.dispatch('pushHistoryExchange', { key: self.getKey(), order: {
                                    quote: self.getQuoteCurrency(),
                                    base: self.getBaseCurrency(),
                                    amount: element.q,
                                    limit_price: element.p,
                                    limit_price_converted: (element.p) / (1/self.getFxRate()),
                                    timestamp: new Date(element.dataTime).toString().split(' ')[4],
                                    exchange: self.getName(),
                                    side: element.s == 'BUY' ? 'buy' : 'sell',
                                    color: ((element.p) > last.limit_price) ? 'buy' : 'sell'
                                }})
                            }
                            break
                        }
                            
                        default: {
                            console.log('missing switch', message.result.channel)
                        }
                    }
                }
                this.connection.private.socket.onmessage = function (event) {
                    self.connection.private.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    const message =  JSON.parse(event.data)

                    if ('method' in message && message.method == 'public/heartbeat') {
                        let heartbeat_request = {
                            'id': message.id,
                            'method': 'public/respond-heartbeat'
                        }
                        // console.log('heartbeat_request', heartbeat_request)
                        self.connection.private.socket.send(JSON.stringify(heartbeat_request))
                        return
                    }

                    console.log('private', message)
                }
            },
            mutateData(data) {
                // console.log('mutateData', data)
                const results = {
                    bids: {},
                    asks: {}
                }

                for (let index = 0; index < data.bids.length; index++) {
                    const price = data.bids[index][0] * 1
                    const price_converted = (this.getFxRate() == 0) ? 0: (price) / (1/this.getFxRate())
                    const volume = data.bids[index][1] * 1
                    results.bids[price] = {
                        amount: volume,
                        limit_price: price,
                        limit_price_converted: price_converted
                    }
                }
    
                for (let index = 0; index < data.asks.length; index++) {
                    const price = data.asks[index][0] * 1
                    const price_converted = (this.getFxRate() == 0) ? 0: (price) / (1/this.getFxRate())
                    const volume = data.asks[index][1] * 1
                    results.asks[price] = {
                        amount: volume,
                        limit_price: price,
                        limit_price_converted: price_converted
                    }
                }
                return results
            }
        })
    }
}
export default Cryptocom