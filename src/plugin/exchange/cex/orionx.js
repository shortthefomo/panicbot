'use strict'

import Cex from './cex.js'

import Orionx from 'orionx-sdk'
import pusher from './helper/pusher.js'
import decimal from 'decimal.js'



class OrionX extends Cex {
    constructor($store) {
        super($store)

        this.setName('orionx')
        this.channel = null
        this.channel_trades = null
        this.channel_private = null
        this.ready = false
        this.book_offers = {
            asks: [],
            bids: []
        }
        this.reconnects = 0
        this.client_id  = null

        Object.assign(this, {
            setMarketPair(quote, base) {
                // if (!this.getAvailablePairs().includes(market_code)) {
                //     throw new Error(`${market_code} is not available for ${this.getName()}`)
                // }
                console.log('quote', quote)
                console.log('base', base)
                this.setMarketCode(quote, base)
                this.ready = true
            },
            getFiatPairs() {
                const fiat = {}
                fiat['CLP'] = 'CLP'
                console.log('fiat', fiat)
                return fiat
            },
            getFiatPairsBaseXRP() {
                const fiat = {}
                fiat['CLP'] = 'CLP'
                console.log('fiat', fiat)
                return fiat
            },
            getIntervals() {
                return []
            },
            // eslint-disable-next-line
            async getOHCL(pair, interval = 3600) {
                return {}
            },
            hasChart() {
                return false
            },
            async getMarketsData() {
                let structured = {}
    
                structured['XRPCLP'] = {
                    exchange: this.getName(),
                    market: 'XRPCLP',
                    base: 'XRP',
                    quote: 'CLP',
                    active: true,
                    trade_fee: '0.66', // https://orionx.com/es/fees/
                    ordermin: 0.5,
                    ordermin_base: 'XRP',
                    lot_decimals: 8,
                    pair_decimals: 2,
                }
                structured['XRPBTC'] = {
                    exchange: this.getName(),
                    market: 'XRPBTC',
                    base: 'XRP',
                    quote: 'BTC',
                    active: true,
                    trade_fee: '0.66', // https://orionx.com/es/fees/
                    ordermin: 0.5,
                    ordermin_base: 'XRP',
                    lot_decimals: 8,
                    pair_decimals: 8,
                }

                structured['BTCCLP'] = {
                    exchange: this.getName(),
                    market: 'BTCCLP',
                    base: 'BTC',
                    quote: 'CLP',
                    active: true,
                    trade_fee: '0.66', // https://orionx.com/es/fees/
                    ordermin: 0.0001,
                    ordermin_base: 'BTC',
                    lot_decimals: 8,
                    pair_decimals: 2,
                }

                console.log('structured', structured)
                return structured
            },
            
            async init() {
                
                if (this.ready == false) { return }

                Orionx.setCredentials({
                    apiKey: $store.getters.getAccess?.keys?.VUE_APP_ORIONX_APIKEY,
                    secretKey: $store.getters.getAccess?.keys?.VUE_APP_ORIONX_SECRETKEY,
                    apiUri: $store.getters.getAccess?.keys?.VUE_APP_ORIONX_APIURI,
                })
                this.client_id = await Orionx.me()

                console.log('market code.. ' + this.getMarketCode())
                try {
                    const token = await Orionx.requestRealtimeToken()
                    console.log('token', token.token)
                    this.channel_private = pusher.subscribe(`private-${token.token}`)
                    this.listenPrivate()
                } catch (error) {
                    console.error(error)

                    if (!$store.getters.getConnected(this.getKey())) {
                        $store.dispatch('updateConnection', { key: this.getKey(), value: false })
                    }
                }

                this.channel = pusher.subscribe('prod-' + this.getMarketCode() + '-orderBook')
                this.listenBook()

                const wallets = await Orionx.wallets({})
                const balances = {}
                for (let index = 0; index < wallets.length; index++) {
                    const wallet = wallets[index]
                    if (wallet.currency.code != this.getBaseCurrency() && wallet.currency.code != this.getQuoteCurrency()) { continue }
                    switch(wallet.currency.code) {
                        case 'BTC': 
                            balances[wallet.currency.code] = new decimal(wallet.availableBalance).div(1_000_000_00).toFixed(10)
                            break
                        case 'XRP': 
                            balances[wallet.currency.code] = new decimal(wallet.availableBalance).div(1_000_000).toFixed(8)
                            break
                        case 'CLP':
                            balances[wallet.currency.code] = new decimal(wallet.availableBalance).toFixed(0)
                            break
                    }
                }
                const payload = {}
                payload.value = balances
                payload.key = this.getKey()
                $store.dispatch('updateBalances', payload)

                this.channel_trades = pusher.subscribe('prod-' + this.getMarketCode() + '-trades')
                this.listenTrades()

                
                
                console.log(`pusher connection Open ${this.getName()}`)
            },
            listenPrivate() {
                this.channel_private.bind('wallets', function (wallets) {
                    const balances = {}
                    for (let index = 0; index < wallets.length; index++) {
                        const wallet = wallets[index]
                        if (wallet.currency.code != this.getBaseCurrency() && wallet.currency.code != this.getQuoteCurrency()) { continue }
                        switch(wallet.currency.code) {
                            case 'BTC': 
                                balances[wallet.currency.code] = new decimal(wallet.availableBalance).div(1_000_000_00).toFixed(10)
                                break
                            case 'XRP': 
                                balances[wallet.currency.code] = new decimal(wallet.availableBalance).div(1_000_000).toFixed(8)
                                break
                            case 'CLP':
                                balances[wallet.currency.code] = new decimal(wallet.availableBalance).toFixed(0)
                                break
                        }
                    }
                    const payload = {}
                    payload.value = balances
                    payload.key = this.getKey()
                    $store.dispatch('updateBalances', payload)
                })
            },
            listenTrades() {
                const self = this
                this.channel_trades.bind('new-trade',function (trade) {
                    console.log(self.getMarketCode() + ' trade', trade)

                    const history = $store.getters.getHistoryExchange(self.getKey())
                    const last = (history.length > 0) ? history[0] : 0

                    let div_price = 1
                    let div_amount = 1
                    switch(self.getMarketCode()) {
                        case 'XRPBTC':
                            div_price = 1_000_000_00
                            div_amount = 1_000_000
                            break
                        case 'BTCCLP':
                            div_amount = 1_000_000_00
                            break
                        case 'XRPCLP':
                            div_amount = 1_000_000
                            break
                    }

                    $store.dispatch('pushHistoryExchange', { key: self.getKey(), order: {
                        id: trade._id,
                        quote: self.getQuoteCurrency(),
                        base: self.getBaseCurrency(),
                        amount: new decimal(trade.amount).div(div_amount).toFixed(8)*1,
                        limit_price: new decimal(trade.price).div(div_price).toFixed(8)*1,
                        timestamp: new Date().getTime(),
                        exchange: self.getName(),
                        side: '-',
                        color: (new decimal(trade.price).div(div_price).toFixed(8)*1 > last.limit_price) ? 'buy' : 'sell'
                    }})

                })
            },
            listenBook() {
                const self = this
                
                Orionx.marketOrderBook({
                    marketCode: this.getMarketCode(), 
                    limit: 100
                }).then(async (orderbook) => {
                    // console.log(`${this.getKey()} orderbook`, orderbook)
                    self.mutateData(orderbook)

                    this.channel.bind('new', function (newItem) {
                        // console.log('newItem', newItem)
                        const key = newItem.sell ? 'sell' : 'buy'
                        let index = 0
                        for (var i = 0; i < orderbook[key].length; i++) {
                            const item = orderbook[key][i]
                            if (newItem.sell && item.limitPrice > newItem.limitPrice) {
                                index = i
                                break
                            }
                            if (!newItem.sell && item.limitPrice < newItem.limitPrice) {
                                index = i
                                break
                            }
                            index = i + 1
                        }

                        orderbook[key].splice(index, 0, {
                            limitPrice: newItem.limitPrice,
                            amount: newItem.amount
                        })
                        self.mutateData(orderbook)
                    })
                    this.channel.bind('updated', function (updatedItem) {
                        // console.log('updatedItem', updatedItem)

                        const key = updatedItem.sell ? 'sell' : 'buy'
                        for (var i = 0; i < orderbook[key].length; i++) {
                            const item = orderbook[key][i]
                            if (item.limitPrice === updatedItem.limitPrice) {
                                orderbook[key][i].amount = updatedItem.amount
                            }
                        }
                        self.mutateData(orderbook)
                    })
                    this.channel.bind('deleted', function (deleteItem) {
                        // console.log('deleteItem', deleteItem)

                        const key = deleteItem.sell ? 'sell' : 'buy'
                        for (var i = 0; i < orderbook[key].length; i++) {
                            const item = orderbook[key][i]
                            if (item.limitPrice === deleteItem.limitPrice) {
                                orderbook[key].splice(i, 1)
                            }
                        }
                        self.mutateData(orderbook)
                        
                    })
                }).catch((error) => {
                    console.error('OrionX Error', error)
                    $store.dispatch('updateConnection', { key: this.getKey(), value: false })
                    this.reconnects = this.reconnects + 1
                    this.restart()
                })
            },
            mutateData(data) {
                $store.dispatch('updateConnection', { key: this.getKey(), value: true })
                // console.log('mutateData', data)
                const results = {
                    bids: {},
                    asks: {}
                }

                let div_price = 1
                let div_amount = 1
                switch(this.getMarketCode()) {
                    case 'XRPBTC':
                        div_price = 1_000_000_00
                        div_amount = 1_000_000
                        break
                    case 'BTCCLP':
                        div_amount = 1_000_000_00
                        break
                    case 'XRPCLP':
                        div_amount = 1_000_000
                        break
                }
                // performance issues.... FUCK@!

                // for (let index = 0; index < data.sell.length; index++) {
                //     const price = new decimal(data['sell'][index]['limitPrice']).div(div_price)
                //     const volume = new decimal(data['sell'][index]['amount']).div(div_amount) //.toFixed(8)
                //     results.asks[price] = {
                //         amount: volume.toFixed(8),
                //         limit_price: price.toFixed(8),
                //         quality: new decimal(volume).div(price).toFixed(8) 
                //     }
                // }
    
                // for (let index = 0; index < data.buy.length; index++) {
                //     const price = new decimal(data['buy'][index]['limitPrice']).div(div_price)
                //     const volume = new decimal(data['buy'][index]['amount']).div(div_amount)
                //     results.bids[price] = {
                //         amount: volume.toFixed(8),
                //         limit_price: price.toFixed(8),
                //         quality: new decimal(volume).div(price).toFixed(8) 
                //     }
                // }

                for (let index = 0; index < data.sell.length; index++) {
                    const price = data['sell'][index]['limitPrice'] / div_price
                    const volume = data['sell'][index]['amount'] / div_amount
                    results.asks[price] = {
                        amount: volume,
                        limit_price: price,
                        quality: volume / price
                    }
                }
    
                for (let index = 0; index < data.buy.length; index++) {
                    const price = data['buy'][index]['limitPrice'] / div_price
                    const volume = data['buy'][index]['amount'] / div_amount
                    results.bids[price] = {
                        amount: volume,
                        limit_price: price,
                        quality: volume / price
                    }
                }

                // console.log(`${this.getKey()} results orderbook`, results)

                const payload = {}
                payload.offers = results
                payload.key = this.getKey()           
                $store.dispatch('updateBookExchange', payload)
            },
            async pause(milliseconds = 3000) {
                return new Promise(resolve =>  {
                    console.log('pausing.... ' + milliseconds)
                    setTimeout(resolve, milliseconds)
                })
            },
            async restart() {
                if ((this.reconnects) > 15) {
                    console.log(this.getKey() + ' stopped trying reconnect')
                    return
                } 
                if ((this.reconnects) > 10) {
                    console.log(this.getKey() + ' long pause 20 minutes')
                    await this.pause(1200000)
                }
                if ((this.reconnects) > 5) {
                    console.log(this.getKey() + ' medium pause 2 minutes')
                    await this.pause(120000)
                } 
                else {
                    console.log(this.getKey() + ' short pause 5 seconds')
                    await this.pause(5000)
                } 
                this.init()
            },
            // eslint-disable-next-line
            async placeMarketOrder(amount, sell, inverse_amount, test = true) {
                if (this.client_id == null) { return false }

                console.log(`${this.getKey()} placing order`, {marketCode: this.getMarketCode(), amount: amount, sell: sell, client_id: this.client_id})
                switch(this.getMarketCode()) {
                case 'XRPBTC':
                    amount = (sell) ? new decimal(amount).mul(1_000_000).toFixed(8) : new decimal(inverse_amount).toFixed(0)
                    break
                case 'BTCCLP':
                    amount = (sell) ? new decimal(amount).mul(1_000_000_00).toFixed(10) : new decimal(inverse_amount).toFixed(0)
                    break
                case 'XRPCLP':
                    amount = (sell) ? new decimal(amount).mul(1_000_000).toFixed(8) : new decimal(inverse_amount).toFixed(0)
                    break
                }
                
                // console.log(`altered`, amount)

                if (test) { return }
                const data = await Orionx.placeMarketOrder({
                    marketCode: this.getMarketCode(), 
                    amount: amount, 
                    sell: sell, 
                    client_id: this.client_id
                })

                console.log('result', data)
                return true
            }
        })
    }
}

export default OrionX