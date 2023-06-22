'use strict'
/* eslint-disable */

import Exchange from '../exchange.js'
import axios from 'axios'
import decimal from 'decimal.js'


import { hexToBytes,
    currencyHexToUTF8,
    fromLedgerAmount,
    deriveExchanges,
    LogTrade } from './helper/utils.js'

class XRPL extends Exchange {
    constructor($store, client, iou_issuer) {
        super()
        this.servers = (process.env.VUE_APP_ENDPOINTS == 'production') ? process.env.VUE_APP_XRPL_CLIENT_LOCAL : process.env.VUE_APP_XRPL_CLIENT_TESTNET
        this.client = client
        this.account = {
            trustlines: [],
            base: {
                currency: null,
                currency_hex: null,
                issuer: null,
                balance: 0,
                available: 0
            },
            quote: {
                currency: null,
                currency_hex: null,
                issuer: null,
                balance: 0,
                available: 0
            },
            reserve: 2,
            account_reserve: 10,
            sequence: 0,
            expired: []
        }
        this.setName('dex-' + iou_issuer)
        this.ready = false
        // this.network_errors = 0

        Object.assign(this, {
            getIntervals() {
                return [
                    { label: '5 min', value: '5m'},
                    { label: '15 min', value: '15m'},
                    { label: '1 hour', value: '1h' },
                    { label: '6 hour', value: '6h'},
                    { label: '1 day', value: '1d'},
                    { label: '1 week', value: '1w'}
                ]
            },
            // eslint-disable-next-line
            async getOHCL(pair, interval = 60) {
                try {
                    console.log('this.account.quote', this.account.quote)
                    console.log('this.account.quote', this.account.base)

                    // need to calculate a 1000 bars
                    const date = new Date()
                    const originalDay = date.getDate()
                    
                    switch (interval) {
                        case '5m':
                            const interval5 = 5000 
                            date.setTime(date.getTime() - (interval5*60*1000))
                            break
                        case '15m':
                            const interval15 = 15000 
                            date.setTime(date.getTime() - (interval15*60*1000))
                            break
                        case '1h':
                            const interval1 = 1000 
                            date.setTime(date.getTime() - (interval1*60*60*1000))
                            break
                        case '6h':
                            const interval6 = 6000 
                            date.setTime(date.getTime() - (interval6*60*60*1000))
                            break
                        case '1d':
                            const intervalToSub = 1000 //1d default
                            const newDay = originalDay - intervalToSub
                            date.setDate(newDay)
                            break
                        case '12':
                            break
                    }
                    
                    // console.log(date.getTime())

                    console.log(`https://api.sologenic.org/api/v1/ohlc?symbol=XRP%2F${this.account.quote.currency}%2B${this.account.quote.issuer}&period=${interval}&from=${Math.trunc(date.getTime()/1000)}&to=${Math.trunc(new Date().getTime()/1000)}`)
                    const {data} = await axios.get(`https://api.sologenic.org/api/v1/ohlc?symbol=XRP%2F${this.account.quote.currency}%2B${this.account.quote.issuer}&period=${interval}&from=${Math.trunc(date.getTime()/1000)}&to=${Math.trunc(new Date().getTime()/1000)}`)
                    // console.log('data', data)
                    if ('error' in data) { return {} } 
                    const ohlc = []
                    for (let index = 0; index < data.length; index++) {
                        const element = data[index]
                        ohlc.push([element[0], element[1], element[2], element[3], element[4], 0, element[5], 0])
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

            // getIntervals() {
            //     return [
            //         { label: '5 min', value: 5},
            //         { label: '15 min', value: 15},
            //         { label: '1 hour', value: 60 },
            //         { label: '4 hour', value: 240},
            //         { label: '1 day', value: 'D'},
            //         { label: '1 week', value: 'W'}
            //     ]
            // },
            // // eslint-disable-next-line
            // async getOHCL(pair, interval = 60) {
            //     try {
            //         console.log('this.account.quote', this.account.quote)
            //         console.log('this.account.quote', this.account.base)
            //         const {data} = await axios.get(`https://api.onthedex.live/public/v1/ohlc?base=XRP&quote=${this.account.quote.currency}.${this.account.quote.issuer}&bars=1000&interval=${interval}`)
            //         console.log('data', data)
            //         if ('error' in data) { return {} } 
            //         const ohlc = []
            //         for (let index = 0; index < data.data.ohlc.length; index++) {
            //             const element = data.data.ohlc[index]
            //             ohlc.push([element.t*1, element.o, element.h, element.l, element.c, 0, element.vq, 0])
            //         }

            //         const payload = {}
            //         payload.key = this.getKey()
            //         payload.interval = interval
            //         payload.value = ohlc
            //         $store.dispatch('updateOHLCExchange', payload)

            //         return ohlc
            //     }
            //     catch (e) {
            //         console.error('error', e)
            //         return {}
            //     }
            // },
            hasChart() {
                return true
            },
            setMarketPair(base_currency_hex, quote_currency_hex, base_currency_issuer, quote_currency_issuer) {
                this.account.base = {
                    currency: currencyHexToUTF8(base_currency_hex),
                    currency_hex: base_currency_hex,
                    issuer: base_currency_issuer,
                    balance: 0,
                    available: 0
                }
                this.account.quote = {
                    currency: currencyHexToUTF8(quote_currency_hex),
                    currency_hex: quote_currency_hex,
                    issuer: quote_currency_issuer,
                    balance: 0,
                    available: 0
                }
                this.setMarketCode(this.account.quote.currency, this.account.base.currency)
                this.ready = true
            },
            async start() {
                if (this.ready == false) {
                    throw new Error(`${this.getMarketCode()} is not read for ${this.getName()}`)
                }
                this.isConnected()
                this.listenOffers()
                this.pollingBookOffers()
                this.connectionListener()
                this.ledgerClose()
                // only add one listener as we have multiple instances of class.
                if ($store.getters.getNodeStartedInfo) { return }
                $store.dispatch('startNodeInfo')
                this.checkConnection()
            },
            stop() {
                this.removeAllListeners()
                this.client.close()
                const payload = {}
                payload.offers = {asks:[], bids:[]}
                payload.key = this.getKey()
                $store.dispatch('updateBookExchange', payload)

            },
            async isConnected() {
                this.state = await this.client.getState()
                // console.log('state', this.state)
                const server_info = await this.client.send({"id": 1, "command": "server_info"})
                // console.log('server_info', server_info)
                this.state.peers = server_info.info.peers
                this.state.server_state = server_info.info.server_state
                const network = this.getNetwork()
                this.state.network_errors = network.errors
                
                $store.dispatch('setNodeInfo', this.state)
                if (this.getNetwork().error) {
                    console.log('error here', this.getNetwork())
                }
                if (this.state != null && this.state.online == true && this.getNetwork().error == false) {
                    $store.dispatch('updateConnection', { key: this.getKey(), value: true })
                    $store.dispatch('start', this.getKey())
                    return true
                }
                $store.dispatch('updateConnection', { key: this.getKey(), value: false })
                $store.dispatch('stop', this.getKey())
                return false    
            },
            async forceNextUplink() {
                this.clearNetworkError()

                const network = this.getNetwork()
                if (network.errors > 10) {
                    this.client.reinstate({forceNextUplink: true})
                    console.log('reinstate client', await this.client.send({ command: 'server_info' }))
                    this.resetNetworkError()
                }
            },
            connectionListener() {
                const self = this
                this.addListener('check_' + this.getKey() + '-connection', async () => {
                    
                    const connected = await self.isConnected()
                    // console.log('checking connection ' + this.getKey() + '-connection')
                    // console.log('connected', connected)
                    if (!connected) {
                        const network = self.getNetwork()
                        network.error = true
                        network.error_message = 'Not connected xrpl-client status'
                        network.time_error = new Date().getTime()
                        self.setNetworkError(network)
                    }
                    
                    await self.forceNextUplink()

                    // as using timeouts now callback on  ones self
                    self.checkConnection()
                })
            },
            checkConnection() {
                const self = this
                setTimeout(() => {
                    // console.log('check_' + this.getKey() + '-connection')
                    self.emit('check_' + this.getKey() + '-connection')
                }, 1500)
            },
            pauseConnectionCheck(milliseconds = 5000) {
                return new Promise(resolve => {setTimeout(resolve, milliseconds)})
            },
            pauseOrderBook(milliseconds = 500) {
                return new Promise(resolve => {setTimeout(resolve, milliseconds)})
            },
            pollingBookOffers() {
                this.emit('fetch_' + this.getKey())
            },
            listenOffers() {
                console.log('getAddress', $store.getters.getAddress)
                const worker = async () => {
                    const asks_books = {
                        'id': 2,
                        'command': 'book_offers',
                        'taker': $store.getters.getAddress,
                        'taker_gets': {'currency': this.account.quote.currency_hex, 'issuer': this.account.quote.issuer},
                        'taker_pays': {'currency': this.account.base.currency_hex }
                    }
                    const bids_books = {
                        'id': 3,
                        'command': 'book_offers',
                        'taker': $store.getters.getAddress,
                        'taker_gets': {'currency': this.account.base.currency_hex},
                        'taker_pays': {'currency': this.account.quote.currency_hex, 'issuer': this.account.quote.issuer }
                    }    
                    const book_result = await Promise.all([
                        this.client.send(asks_books),
                        this.client.send(bids_books),
                    ])
                    const network = this.getNetwork()
                    if ('error' in book_result[0]) {
                        network.error = true
                        network.error_message = book_result[0].error
                        network.time_error = new Date().getTime()
                        this.setNetworkError(network)
                        this.ready = false
                        $store.dispatch('stop', this.getKey())
                        console.error(book_result[1])
                        return
                    }
                    if ('error' in book_result[1]) {
                        network.error = true
                        network.error_message = book_result[1].error
                        network.time_error = new Date().getTime()
                        this.setNetworkError(network)
                        this.ready = false
                        $store.dispatch('stop', this.getKey())
                        console.error(book_result[1])
                        return
                    }
                    
                    const book_offers = {
                        'asks': book_result[1].offers,
                        'bids': book_result[0].offers
                    }
                    const data = this.mutateData(book_offers)
                    const payload = {}
                    payload.offers = data
                    payload.key = this.getKey()
                    $store.dispatch('updateBookExchange', payload)
                } 

                const self = this
                this.addListener('fetch_' + this.getKey(), async () => {
                    await worker()
                    await self.pauseOrderBook()
                    self.pollingBookOffers()
                })
            },
            mutateData(data) {
                const results = {
                    bids: {},
                    asks: {}
                }

                for (let index = 0; index < data.bids.length; index++) {
                    const offer = data.bids[index]
                    
                    if ('Expiration' in offer && offer.Expiration < this.ledgerEpoch()) { continue }
                    if (offer.Account == $store.getters.getAddress) { continue }
                        
                    const price = 1 / ((offer.TakerPays / 1_000_000) / offer.TakerGets.value)
                    // todo conver this to use decimal js..
                    const volume = ('taker_pays_funded' in offer && (offer.taker_pays_funded * 1 > 0)) ? offer.taker_pays_funded / 1_000_000 : offer.TakerPays / 1_000_000
                    if (price in results.bids) {
                        results.bids[price].amount += volume
                        continue
                    }
                    results.bids[price] = {
                        amount: volume,
                        limit_price: price,
                        address: offer.Account,
                        quality: offer.quality
                    }
                }

                for (let index = 0; index < data.asks.length; index++) {
                    const offer = data.asks[index]
                    if ('Expiration' in offer && offer.Expiration < this.ledgerEpoch()) { continue }
                    if (offer.Account == $store.getters.getAddress) { continue }

                    const price = 1 / ((offer.TakerGets / 1_000_000) / offer.TakerPays.value)
                    // todo conver this to use decimal js..
                    const volume = ('taker_gets_funded' in offer) ? offer.taker_gets_funded / 1_000_000 : offer.TakerGets / 1_000_000
                    if (price in results.asks) {
                        results.asks[price].amount += volume
                        continue
                    }
                    results.asks[price] = {
                        amount: volume,
                        limit_price: price,
                        address: offer.Account,
                        quality: 1/offer.quality
                    }
                }
                return results
            },
            ledgerEpoch() {
                const unix_time = Date.now() 
                return Math.floor((unix_time) / 1000) - 946684800
            },
            ledgerClose() {
                const callback = async (event) => {
                    let request = {
                        'id': 'xrpl-local',
                        'command': 'ledger',
                        'ledger_hash': event.ledger_hash,
                        'ledger_index': 'validated',
                        'transactions': true,
                        'expand': true,
                        'owner_funds': true
                    }
    
                    const ledger_result = await this.client.send(request)
                    if ('error' in ledger_result) {
                        const network = this.getNetwork()
                        network.error = true
                        network.error_message = ledger_result.error
                        network.time_error = new Date().getTime()
                        this.setNetworkError(network)
                    }
                    
                    if ('ledger' in ledger_result && 'transactions' in ledger_result.ledger) {
                        for (let i = 0; i < ledger_result.ledger.transactions.length; i++) {
                            const transaction = ledger_result.ledger.transactions[i]
                            if (transaction.TransactionType == 'OfferCreate') {
                                
                                const exchanges = deriveExchanges(transaction)
                                if (exchanges.length <= 0) { continue }
        
                                for (let index = 0; index < exchanges.length; index++) {
                                    const exchange = exchanges[index]
                                    
                                    if ((exchange.base.currency == this.account.base.currency 
                                        && exchange.quote.currency == this.account.quote.currency)  || 
                                        (exchange.base.currency == this.account.quote.currency 
                                            && exchange.quote.currency == this.account.base.currency)) {
                                        
                                        console.log('exchange', exchange.base.currency, exchange.quote.currency, exchange.volume.toString())
                                    }

                                    const last = ($store.getters.getHistoryExchange(this.getKey()).length > 0) ? $store.getters.getHistoryExchange(this.getKey())[0] : 0
                                    const data = LogTrade(ledger_result, exchange, transaction, this.account, last, this.getName(), this.getFxRate())
                                    if (data != null) {
                                        $store.dispatch('pushHistoryExchange', { key: this.getKey(), order: data })
                                        // self.emit('history_' + this.getMarketCode() + '_EX', data)    
                                    }
                                }
                            }
                        }
                    }
                }

                this.client.on('ledger', callback)
            },
        })
    }
}

export default XRPL