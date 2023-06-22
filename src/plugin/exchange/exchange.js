'use strict'

import { EventEmitter } from 'events'

class Exchange extends EventEmitter {
    constructor() {
        super()
        let name = ''
        let key = ''
        let base = null
        let quote = null
        let available_pairs = []

        let fxrate = 0

        let network = {
            errors: 0,
            error: false,
            error_messages: [],
            last_messages: ''
        }

        Object.assign(this, {
            setFxRate(rate) {
                fxrate = rate
            },
            getFxRate() {
                return fxrate
            },
            setAvailablePairs(pairs) {
                available_pairs = pairs
            },
            getAvailablePairs() {
                return available_pairs
            },
            setMarketCode(quoteValue, baseValue) {
                quote = quoteValue
                base = baseValue
                this.setKey()
            },
            clearNetworkError() {
                network['error'] = false
            },
            resetNetworkError() {
                network['error'] = false
                network['errors'] = 0
            },
            setNetworkError(value) {
                network['errors']++
                network['error'] = value.error
                network['error_messages'].push({ time: value.last_error, message: value.error_message })
                network['last_messages'] = value.error_message
            },
            getNetwork() {
                return network
            },
            getMarketCode() {
                return base + quote
            },
            getBaseCurrency() {
                return base
            },
            getQuoteCurrency() {
                return quote
            },
            getErrorMessage() {
                return network.error_message
            },
            setName(value) {
                name = value
            },
            setKey() {
                key = name + '-' + base + quote
            },
            getKey() {
                return key
            },
            getName() {
                return name
            }
        })
    }
}

export default Exchange