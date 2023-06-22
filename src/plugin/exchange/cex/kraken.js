'use strict'

import Cex from './cex.js'

// import ccxt from 'ccxt'
import qs from 'qs'
import axios from 'axios'
import crypto from 'crypto'
import currencies from './../../currencies.js'

class Kraken extends Cex {
    constructor($store) {
        super($store)

        this.setName('kraken')
        

        // this.ccxt = new ccxt.kraken({
        //     apiKey: process.env.VUE_APP_KRAKEN_APIKEY,
        //     secret: process.env.VUE_APP_KRAKEN_SECRETKEY
        // })

        this.book_synced = true

        this.connection.private.uri = 'wss://ws-auth.kraken.com'
        this.connection.public.uri = 'wss://ws.kraken.com'
        this.book_depth = 10 // default value 10
        this.book_offers = {
            asks: {},
            bids: {}
        }
        this.ready = false
        this.asset_pairs = null
        
        // TODO SET LIMITS FOR XRP
        // withdrawl: '0.02',
        // withdrawl_min: 25

        Object.assign(this, {
            setMarketPair(quote, base) {
                // if (!this.getAvailablePairs().includes(market_code)) {
                //     throw new Error(`${market_code} is not available for ${this.getName()}`)
                // }
                this.setMarketCode(quote, base)
                this.ready = true
            },
            getFiatPairs() {
                const world = currencies.world()
                const data = this.asset_pairs

                const fiat = {}
                for (let index = 0; index < world.length; index++) {
                    const element = world[index]
                    for (const property in data) {
                        if (data[property].wsname.split('/')[1] == element.code) {
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
                    for (const property in data) {
                        if (data[property].wsname.split('/')[1] == element.code && data[property].wsname.split('/')[0] == 'XRP') {
                            fiat[element.code] = element.code
                        }
                    }
                }
                console.log('fiat', fiat)
                return fiat
            },
            getIntervals() {
                return [
                    { label: '1 min', value: 1*60},
                    { label: '5 min', value: 5*60},
                    { label: '15 min', value: 15*60},
                    { label: '30 min', value: 30*60},
                    { label: '1 hour', value: 60*60},
                    { label: '4 hour', value: 240*60},
                    { label: '1 day', value: 1440*60},
                    { label: '1 week', value: 10080*60},
                    { label: '2 week', value: 21600*60}
                ]
            },
            async getOHCL(pair, interval = 3600) {
                interval = interval / 60
                try {
                    
                    const {data} = await axios.get(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`)
                    // console.log('data.result', data.result)
                    for (const property in data.result) {
                        if (property == 'last') { continue }
                        const payload = {}
                        payload.key = this.getKey()
                        payload.interval = interval * 60
                        payload.value = data.result[property]
                        $store.dispatch('updateOHLCExchange', payload)
                    }

                    return data.result.pair
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
                    const {data} = await axios.get('https://api.kraken.com/0/public/AssetPairs')
                    this.asset_pairs = data.result

                    for (const property in data.result) {
                        const element = data.result[property]
                        if (element.wsname.split('/')[0] != 'USDT') {
                            structured[element.wsname.split('/')[0] + element.wsname.split('/')[1]] = {
                                exchange: this.getName(),
                                market: element.wsname.split('/')[0] + element.wsname.split('/')[1],
                                base: element.wsname.split('/')[0],
                                quote: element.wsname.split('/')[1],
                                active: true,
                                trade_fee: element.fees[0][1],
                                ordermin: element.ordermin,
                                ordermin_base: element.wsname.split('/')[0],
                                lot_decimals: element.lot_decimals,
                                pair_decimals: element.pair_decimals,
                                // initial: property,
                                // initial_data: element
                            }
                        }
                    }
                    console.log('structured', structured)
                    this.setAvailablePairs(structured)
    
                    return structured
                }
                catch (e) {
                    console.error('error', e)
                    return {}
                }
            },
            createAuthenticationSignature(apiPrivateKey, apiPath, endPointName, nonce, apiPostBodyData) {
                console.log('$store.getters.getAccess', $store.getters.getAccess)
                console.log('apiPrivateKey', apiPrivateKey)
                const apiPost = nonce + apiPostBodyData
                const secret = Buffer.from(apiPrivateKey, 'base64')
                const sha256 = crypto.createHash('sha256')
                const hash256 = sha256.update(apiPost).digest('binary')
                const hmac512 = crypto.createHmac('sha512', secret)
                const signatureString = hmac512.update(apiPath + endPointName + hash256, 'binary').digest('base64')
                return signatureString
            },
            async getToken() {
                const privatePath = '/0/private/'
                const endPointName = 'GetWebSocketsToken'
                const apiEndpointFullURL = 'https://api.kraken.com' + privatePath + endPointName
                const nonce = Date.now().toString()
                const apiPostBodyData = "nonce=" + nonce

                const signature = this.createAuthenticationSignature($store.getters.getAccess?.keys?.VUE_APP_KRAKEN_SECRETKEY,
                    privatePath,
                    endPointName,
                    nonce,
                    apiPostBodyData)

                const httpOptions = {
                    headers: { 'API-Key': $store.getters.getAccess?.keys?.VUE_APP_KRAKEN_APIKEY, 'API-Sign': signature }
                }
                try {
                    
                    const {data} = await axios.post(apiEndpointFullURL, apiPostBodyData, httpOptions)

                    if ('result' in data && 'token' in data.result) {
                        this.token = data.result.token
                        console.log('token', this.token)
                    }
                } catch (e) {
                    console.error(`${this.getKey()} failed to fetch token`)
                    this.restart()
                }
            },
            checksum(crc32Diff) {
                const value = $store.getters.getBookExchange(this.getKey())
                let checksum = ''
                for (let index = 0; index < value.asks.length; index++) {
                    //take chunk after .
                    const splitp = value.asks[index].limit_price.toString().replace('.','')
                    const splita = value.asks[index].amount.toString().replace('.','')
                    
                    //strips leading zeros
                    const convp1 = (splitp*1).toString() 
                    const conva1 = (splita*1).toString()

                    checksum = checksum  + convp1.toString() + conva1.toString()
                }

                for (let index = 0; index < value.bids.length; index++) {
                    //take chunk after .
                    const splitp = value.bids[index].limit_price.toString().replace('.','')
                    const splita = value.bids[index].amount.toString().replace('.','')
                    
                    //strips leading zeros
                    const convp1 = (splitp*1).toString()
                    const conva1 = (splita*1).toString()

                    checksum = checksum  + convp1.toString() + conva1.toString()
                }
                
                if (this.crc32(checksum).toString() != crc32Diff) {
                    this.book_synced = false
                    console.error(`${this.getKey()} book out of sync!`)
                }
                else {
                    this.book_synced = true
                }
                checksum = null // its a chunk of data make sure its clear
            },
            crc32(str) {   
                const a_table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
                const b_table = a_table.split(' ').map(function(s){ return parseInt(s,16) })
                let crc = -1
                for(let i=0, iTop=str.length; i<iTop; i++) {
                    crc = ( crc >>> 8 ) ^ b_table[( crc ^ str.charCodeAt( i ) ) & 0xFF]
                }
                return (crc ^ (-1)) >>> 0
            },
            apiUpdateBook(side, data, crc32) {
                for (const x of data) {
                    // const priceLevel = parseFloat(x[0])
                    // const volume = parseFloat(x[1])

                    /* volume = 0 for level removal/deletion */
                    if (x[1] !== '0.00000000') {
                        const row = {
                            amount: x[1], 
                            limit_price: x[0]
                        }

                        this.book_offers[side][x[0]] = row
                    } else {
                        delete this.book_offers[side][x[0]]
                    }
                }

                const payload = {}
                payload.offers = this.book_offers
                payload.key = this.getKey()
                $store.dispatch('updateBookExchange', payload)
                if (crc32 != null) {
                    this.checksum(crc32)
                }
                // here we are replacing book with trimed one
                // we need 10 items for the checksum
                // important to keep window size else we will 
                // become out of sync!

                const offers = {
                    asks: {},
                    bids: {}
                }
                const values = $store.getters.getBookExchange(this.getKey())
                
                for (let index = 0; index < values.asks.length; index++) {
                    const element = values.asks[index]
                    offers.asks[element.limit_price] = element
                }
                for (let index = 0; index < values.bids.length; index++) {
                    const element = values.bids[index]
                    offers.bids[element.limit_price] = element
                }
                this.book_offers = offers
            },
            switchBook(data) {
                const c = ('c' in data) ? data.c : null

                if ('as' in data) {    
                    this.apiUpdateBook('asks', data.as, c)
                }
                if ('a' in data) {
                    this.apiUpdateBook('asks', data.a, c)
                }
                if ('bs' in data) {
                    this.apiUpdateBook('bids', data.bs, c)
                }
                if ('b' in data) {
                    this.apiUpdateBook('bids', data.b, c)
                }
            },
            socketResponses() {
                let first = true
                const self = this
                this.connection.public.socket.onmessage = async function (event) {
                    self.connection.public.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    // we need to unsubscribe then resubscribe to channel
                    if (!self.getStarted()) { 
                        console.log('not started......')
                        return 
                    }
                    if (!self.book_synced && self.getStarted()) {
                        console.log('firing restart!')
                        self.restart()
                        return
                    }

                    const message =  JSON.parse(event.data)
                    if (message.event == 'heartbeat') { return }

                    if (message.event == 'systemStatus' || message.event == 'subscriptionStatus') {
                        console.log('connection', message)
                        return 
                    }
                    
                    if (Array.isArray(message)) {
                        if (message[2] == 'book-' + self.book_depth && message[3] != self.getBaseCurrency() + '/' + self.getQuoteCurrency()) { 
                            console.error(`${this.getKey()} wrong channel`, message)
                            console.error('base/quote', self.getBaseCurrency() + '/' + self.getQuoteCurrency())
                            return
                        }
                        if (message[3] == 'book-' + self.book_depth && message[4] != self.getBaseCurrency() + '/' + self.getQuoteCurrency()) { 
                            console.error(`${this.getKey()} wrong channel`, message)
                            console.error('base/quote', self.getBaseCurrency() + '/' + self.getQuoteCurrency())
                            return
                        }

                        switch (message[2]) {
                            case 'book-' + self.book_depth: {
                                if (first) {
                                    first = false
                                    console.log('initial book dump', message)
                                }
                                self.switchBook(message[1])
                                break
                            }
                                
                            case 'trade': {
                                for (let index = 0; index < message[1].length; index++) {
                                    const element = message[1][index]
                                    const history = $store.getters.getHistoryExchange(self.getKey())
                                    const last = (history.length > 0) ? history[0] : 0
                                    $store.dispatch('pushHistoryExchange', { key: self.getKey(), order: {
                                        quote: self.getQuoteCurrency(),
                                        base: self.getBaseCurrency(),
                                        amount: element[1] *1,
                                        limit_price: element[0] *1,
                                        timestamp: new Date(Math.trunc(element[2]*1000)).getTime(),
                                        exchange: self.getName(),
                                        side: element[3] == 'b' ? 'buy' : 'sell',
                                        color: ((element[0] *1) > last.limit_price) ? 'buy' : 'sell'
                                    }})
                                }
                                break
                            }

                            default: {
                                if (message[3] == 'book-' + self.book_depth) {
                                    self.switchBook(message[1])
                                    self.switchBook(message[2])
                                }
                                else {
                                    console.log('public missing switch', message)
                                }
                            }
                        }
                    }
                }
                this.connection.private.socket.onmessage = function (event) {
                    self.connection.private.open = true
                    if (!$store.getters.getConnected(self.getKey())) {
                        $store.dispatch('updateConnection', { key: self.getKey(), value: true })
                    }
                    const message =  JSON.parse(event.data)

                    if (typeof message === 'object') {
                        if (message.event == 'subscriptionStatus') {
                            return 
                        }
                        if ('event' in message && message.event == 'systemStatus') { 
                            if (message.version != '1.9.0') {
                                console.warn('version mismatch', message.version, '1.9.0')
                            }
                            return 
                        }
                        if ('event' in message && message.event == 'heartbeat') { return }
                        if ('channel' in message && message.channel == 'balances') {
                            // here need to update the balances
                            const balances = {}
                            if (self.getBaseCurrency() in message.balances) {
                                balances[self.getBaseCurrency()] = message.balances[self.getBaseCurrency()]
                            }
                            else {
                                balances[self.getBaseCurrency()] = 0
                            }
                            if (self.getQuoteCurrency() in message.balances) {
                                balances[self.getQuoteCurrency()] = message.balances[self.getQuoteCurrency()]
                            }
                            else {
                                balances[self.getQuoteCurrency()] = 0
                            }
                            const payload = {}
                            payload.value = balances
                            payload.key = self.getKey()
                            $store.dispatch('updateBalances', payload)
                        }
                    }

                    console.log('private message', message)
                    if (Array.isArray(message)) {
                        switch (message[1]) {
                            case 'ownTrades': {
                                console.log('ownTrades', message[0])
                                break
                            }
                                
                            case 'openOrders': {
                                console.log('openOrders', message[0])
                                break
                            }
                                
                            default: {
                                console.log('private missing switch', message)
                            }
                        }
                    }
                }
            },
            async init() {
                if (this.ready == false) { return }
                await this.getToken()
                this.connection.public.subscriptions.push({ 
                    'event': 'subscribe', 
                    'subscription': { 
                        'name': 'book',
                        'depth': this.book_depth,
                    }, 
                    'pair': [ this.getBaseCurrency() + '/' + this.getQuoteCurrency()]
                })
                this.connection.public.subscriptions.push({ 
                    'event': 'subscribe', 
                    'subscription': { 
                        'name': 'trade' 
                    }, 
                    'pair': [ this.getBaseCurrency() + '/' + this.getQuoteCurrency()]
                })
                this.connection.private.subscriptions.push({ 
                    'event': 'subscribe', 
                    'subscription': { 'name': 'openOrders', 'token': this.token }
                })
                this.connection.private.subscriptions.push({
                    'event': 'subscribe', 
                    'subscription': { 'name': 'ownTrades', 'token': this.token }
                })
                this.connection.private.subscriptions.push({ 
                    'event': 'subscribe', 
                    'subscription': { 'name': 'balances' , 'token': this.token }
                })
                console.log(`openSockets ${this.getName()}`, this.token)

                this.book_offers = {
                    asks: {},
                    bids: {}
                }
                this.book_synced = true
                this.openSockets()
                this.socketResponses()
            },
            // eslint-disable-next-line
            async placeMarketOrder(amount, sell, inverse_amount, test = true) {
                console.log(`${this.getKey()} placing order`, {marketCode: this.getMarketCode(), amount: amount, sell: sell})
                // https://api.kraken.com/0/private/AddOrder

                const privatePath = '/0/private/'
                const endPointName = 'AddOrder'
                const apiEndpointFullURL = 'https://api.kraken.com' + privatePath + endPointName
                const nonce = Date.now().toString()

                const inputParameters =  qs.stringify({
                    ordertype: 'market',
                    type: ((sell) ? "sell": "buy"),
                    volume: amount,
                    pair: this.getMarketCode()
                })
                if (test) {
                    inputParameters.validate = true
                }
                

                console.log('inputParameters', inputParameters)
                const apiPostBodyData = "nonce=" + nonce + "&" + inputParameters

                const signature = this.createAuthenticationSignature($store.getters.getAccess?.keys?.VUE_APP_KRAKEN_SECRETKEY,
                    privatePath,
                    endPointName,
                    nonce,
                    apiPostBodyData)

                const httpOptions = {
                    headers: { 'API-Key': $store.getters.getAccess?.keys?.VUE_APP_KRAKEN_APIKEY, 'API-Sign': signature }
                }
                try {
                    console.log('kraken post', apiEndpointFullURL, apiPostBodyData, httpOptions)
                    const {data} = await axios.post(apiEndpointFullURL, apiPostBodyData, httpOptions)
                    console.log('result', data)
                    return true
                } catch (e) {
                    console.error(`${this.getKey()} failed to post market order`)
                    console.error(e)
                }

                return false
            }
        })
    }
}

export default Kraken