'use strict'

import Cex from './cex.js'

// import ccxt from 'ccxt'

class Valr extends Cex {

    constructor($store, market_code) {
        super($store)

        this.setName('valr - ' + market_code)

        this.setAvailablePairs([
            'XRPZAR'
        ])
        if (!this.getAvailablePairs().includes(market_code)) {
            throw new Error(`${market_code} is not available for ${this.getName()}`)
        }
        this.setMarketCode(market_code)

        this.connection.public.uri = ' wss://api.valr.com/ws/trade'
        this.connection.private.uri = 'wss://api.valr.com/ws/account'
        
        Object.assign(this, {
            
        })
    }
}

export default Valr