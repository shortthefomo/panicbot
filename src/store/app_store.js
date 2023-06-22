'use strict'

 /* eslint-disable */ 
export const AppStore = {
    state: () => ({
        version: '0.0.1',
        pairs: [],
        rate: 0,
        rate_pair: '',
        node: {},
        node_start: false,
        exchange: {},
        history: [],
        access: {},
        address: null
    }),
    actions: {
        init({commit}, payload) {
            commit('INIT', payload)
        },
        updateAccess({commit}, payload) {
            commit('ACCESS', payload)
        },
        pushHistoryExchange({commit}, payload) {
            commit('HISTORY_EXCHANGE', payload)
        },
        updateBookExchange({commit}, payload) {
            commit('BOOOK_EXCHANGE', payload)
        },
        updateOHLCExchange({commit}, payload) {
            commit('OHLC', payload)
        },
        updateConnection({commit}, payload) {
            commit('CONNECTED', payload)
        },
        setVersion({ commit }, version) {
            commit('VERSION', version)
        },
        updateBalances({ commit }, payload) {
            commit('BALANCE', payload)
        },
        updateFxRate({ commit }, payload) {
            commit('FX_RATE', payload)
        },
        startNodeInfo({ commit }) {
            commit('NODE_START')
        },
        setNodeInfo({ commit }, info) {
            commit('NODE', info)
        },
        stop({commit}, key) {
            commit('STOP', key)
        },
        start({commit}, key) {
            commit('START', key)
        },
        setAddress({commit}, address) {
            commit('ADDRESS', address)
        }
    },
    mutations: {
        INIT(state, payload) {
            state.exchange[payload.key] = {
                name: payload.name,
                base: payload.base,
                quote: payload.quote,
                active_pair: payload.base + payload.quote,
                history: [{
                    quote: '',
                    base: '',
                    amount: 0,
                    limit_price: 0,
                    timestamp: 0,
                    exchange: payload.name,
                    side: '-',
                    color: ''
                }],
                balances: {},
                book_offers: {
                    bids: [],
                    asks: []
                },
                network: {
                    connected: false
                },
                OHLC: {}
            }
        },
        ADDRESS(state, address) {
            state.address = address
        },
        STOP(state, key) {
            state.exchange[key].network.connected = false
        },
        START(state, key) {
            state.exchange[key].network.connected = true
        },
        OHLC(state, payload) {
            const key = payload.key
            const interval = payload.interval
            state.exchange[key].OHLC[interval] = payload.value
        },
        CONNECTED(state, payload) {
            const key = payload.key
            state.exchange[key].network.connected = payload.value
        },
        FX_RATE(state, payload) {
            state.rate = payload.rate
            state.rate_pair = payload.market_code
        },
        ACCESS(state, payload) {
            state.access= payload
        },
        BALANCE(state, payload) {
            const key = payload.key
            state.exchange[key].balances = payload.value
        },
        HISTORY_EXCHANGE(state, payload) {
            const order = payload.order
            const key = payload.key

            const copy = [...state.exchange[key].history]
            copy.unshift(order)
            while (copy.length > 100) {
                copy.pop()
            }
            state.exchange[key].history = copy

            const copyAll = [...state.history]
            copyAll.unshift(order)
            while (copyAll.length > 100) {
                copyAll.pop()
            }
            state.history = copyAll
        },
        BOOOK_EXCHANGE(state, payload) {
            const offers = payload.offers
            const key = payload.key
            
            const asks = Object.values(offers.asks).sort((a,b) => (a.limit_price*1 > b.limit_price*1) ? 1 : ((b.limit_price*1 > a.limit_price*1) ? -1 : 0))
            const bids = Object.values(offers.bids).sort((a,b) => (a.limit_price*1 < b.limit_price*1) ? 1 : ((b.limit_price*1 < a.limit_price*1) ? -1 : 0))

            const values = {
                bids: bids.slice(0, 10),
                asks: asks.slice(0, 10)
            }
            
            // state.exchange[key].book_offers = values
            if (JSON.stringify(state.exchange[key].book_offers) != JSON.stringify(values))  {
                state.exchange[key].book_offers = values
            }
        },

        VERSION(state, version) {
            state.version = version
        },
        NODE_START(state) {
            state.node_start = true
        },
        NODE(state, info) {
            state.node = info
        },
    },
    getters: {
        getAddress(state) {
            return state.address
        },
        getNodeStartedInfo(state) {
            return state.node_start
        },
        getNodeInfo(state) {
            return state.node
        },
        getFxRate: state => {
            return state.rate
        },
        getFxPair: state => {
            return state.rate_pair
        },
        getExchangeName: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].name
            }
            return ''
        },
        getExchangeActivePair: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].active_pair
            }
            return ''
        },
        getHistoryAll: (state) => {
            return state.history
        },
        getHistoryExchange: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].history
            }
            return []
        },
        getBookExchange: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].book_offers
            }
            return {
                bids: [],
                asks: []
            }
        },
        getBookExchangeTipAsk: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].book_offers.asks[0]
            }
            return null
        },
        getBookExchangeTipBid: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].book_offers.bids[0]
            }
            return null
        },
        getOHLCExchange: (state) => (key, interval) => {
            if (key in state.exchange) {
                return state.exchange[key].OHLC[interval]
            }
            return {}
        },
        getConnected: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].network.connected
            }
            return false
        },
        getBalances: (state) => (key) => {
            if (key in state.exchange) {
                return state.exchange[key].balances
            }
            return {}
        },
        getVersion: state => {
            return state.version
        },
        getAccess: (state) => {
            return state.access
        }
    }
}