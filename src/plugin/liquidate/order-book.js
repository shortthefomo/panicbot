'use strict'

/* eslint-disable */

import decimal from 'decimal.js'
import { EventEmitter } from 'events'

class OrderBook extends EventEmitter {
    constructor($store) {
        super()
        const routesObject = []
        Object.assign(this, {
            copyRoute(routes, legs) {
                const newLegs = []
                for (let index = 0; index < legs.length; index++) {
                    const leg = legs[index]
                    const newLeg = {}
                    
                    newLeg.route = leg.route
                    newLeg.h1 = leg.h1
                    if ('h2' in leg) {
                        newLeg.h2 = leg.h2
                    }
                    newLegs.push(newLeg)
                }
                return newLegs
            },
            routeCalculation(routes, legs, amount, feeSwitch) {
                const copy = {
                    'a': [...this.copyRoute(routes, legs.a)],
                    'b': [...this.copyRoute(routes, legs.b)],
                }

                for (let index = 0; index < copy['b'].length; index++) {
                    this.liquidateLeg('b', this.getExchangeFromRoute(routes, 'b'), this.getBaseCurrencyFromRoute(routes, 'b'), copy['b'][index], amount, feeSwitch)
                }

                let best = 0
                copy['b'].forEach(element => {
                    const total = ('l2' in element) ? element.l2.amount : ('l1' in element) ? element.l1.amount : 0
                    best = (best < total*1) ? total*1 : best
                })

                for (let index = 0; index < copy['a'].length; index++) {
                    this.liquidateLeg('a', this.getExchangeFromRoute(routes, 'a'), this.getBaseCurrencyFromRoute(routes, 'a'), copy['a'][index], best, feeSwitch)
                }

                return copy
            },
            getExchangeFromRoute(routes, side) {
                for (let index = 0; index < routes.length; index++) {
                    routesObject[routes[index].key] = routes[index]
                }
                for (let index = 0; index < routes.length; index++) {
                    if (routes[index].leg == side) {
                        return routes[index].name
                    }
                }
            },
            getBaseCurrencyFromRoute(routes, side) {
                for (let index = 0; index < routes.length; index++) {
                    if (routes[index].leg == side) {
                        return routes[index].quote 
                    }
                }
            },
            liquidateLeg(side, exchange, routeBaseCurrency, leg, amount, feeSwitch) {
                // console.log('liquidateLeg ->>>', exchange, routeBaseCurrency, leg, amount)
                const hops = leg.route.split('->')
                let liquidate_amount =  {
                    value: amount,
                    base: (side == 'a') ? 'XRP' : routeBaseCurrency
                }

                for (let index = 1; index < hops.length; index++) {
                    const route = {
                        exchange: {
                            name: exchange,
                            key: exchange + '-' + leg['h' + index].key,
                            market_data: routesObject[exchange + '-' + leg['h' + index].key].market_data
                        },
                        book: {
                            quote: leg['h' + index].quote,
                            base: leg['h' + index].base
                        },
                        hop: {
                            index: index,
                            quote: hops[index],
                            base: hops[index - 1],
                        },
                        currency: routeBaseCurrency,
                        amount: liquidate_amount,
                        side: side,
                        leg: leg.route
                    }
                    this.liquidateHop(route, leg, feeSwitch)
                    if ('l' + index in leg) {
                        liquidate_amount = {
                            value: leg['l' + index].amount,
                            base: leg['l' + index].currency,
                        }
                    }
                }
            },
            liquidateHop(route, leg, feeSwitch) {
                route.hop.inverted = ((route.book.quote != route.hop.quote) || (route.book.base != route.hop.base)) ? true: false
                route.amount.inverted = (route.amount.base != route.book.base) ? true: false

                
                if (route.side == 'b' && !route.hop.inverted) {
                    // leg['l' + route.hop.index] = this.test(route, 'asks')
                    leg['l' + route.hop.index] = this.bookSell(route, feeSwitch)
                }
                else if (route.side == 'b' && route.hop.inverted) {
                    // leg['l' + route.hop.index] = this.test(route, 'bids')
                    leg['l' + route.hop.index] = this.bookBuy(route, feeSwitch)
                }


                if (route.side == 'a' && !route.hop.inverted) {
                    // leg['l' + route.hop.index] = this.test(route, 'asks')
                    leg['l' + route.hop.index] = this.bookSell(route, feeSwitch)
                }
                else if (route.side == 'a' && route.hop.inverted) {
                    // leg['l' + route.hop.index] = this.test(route, 'bids')
                    leg['l' + route.hop.index] = this.bookBuy(route, feeSwitch)
                }
            },
            test(route, side) {
                console.log(`liquidateHop --- book${(side == 'bids') ? 'SELL':'BUY'}`, route)
                console.log(`same same`, route.amount.inverted, route.hop.inverted)
                const result = {
                    amount_liquidated: {
                        amount: 1,
                        currency: (!route.amount.inverted) ? route.book.base : route.book.quote
                    },
                    order_count: 1,
                    mid_price: 0,
                    book: route.exchange.key,
                    amount: 1, //tally.toFixed(lot_decimals),
                    currency: (route.amount.inverted) ? route.book.base : route.book.quote,
                    liquidated: true,
                    slippage: 0
                }
                console.log('result', result)
                return result
            },
            liquidateBook(route, side) {
                console.log(`liquidateHop --- book${(side == 'bids') ? 'SELL':'BUY'}`, route)
                const book = $store.getters.getBookExchange(route.exchange.key)
                const lot_decimals = route.exchange.market_data.lot_decimals
                
                let liquidated = false
                let orders = 0
                let last_order_price = 0

                let filled_base_amount = 0
                let filled_quote_amount = 0

                let filled_base_total = 0
                let filled_quote_total = 0

                let partial = new decimal(0)
                let less = new decimal(route.amount.value)

                for (let index = 0; index < book[side].length; index++) {
                    orders++
                    const order =  book[side][index]
                    console.log('order', order)
                    // console.log('filled_base  pre', 
                    //     'total:', filled_base_total.toFixed(lot_decimals), route.book.base
                    // )
                    // console.log('filled_quote pre', 
                    //     'total:', filled_quote_total.toFixed(lot_decimals), route.book.quote
                    // )

                    if (route.amount.inverted) {
                        filled_base_amount = new decimal(order['amount'])
                        filled_quote_amount = new decimal(order['amount']).mul(order['limit_price'])
                    }
                    else {
                        filled_base_amount = new decimal(order['amount']).mul(order['limit_price'])
                        filled_quote_amount = new decimal(order['amount'])
                    }


                    if (route.amount.inverted) {
                        console.log('AAA')
                        if (new decimal(filled_base_total).plus(filled_base_amount).greaterThanOrEqualTo(route.amount.value)) {
                            const value = new decimal(route.amount.value).div(order['limit_price'])
                            partial = partial.plus(value)
                            console.log('XXX added value', value.toFixed(lot_decimals))
                            
                        }
                        else {
                            const value = new decimal(route.amount.value).div(order['limit_price'])
                            partial = partial.plus(filled_base_amount)
                            console.log('XXX added ', filled_base_amount.toFixed(lot_decimals))
                            
                        }
                    }
                    else {
                        console.log('BBB')
                        if (new decimal(filled_base_total).plus(filled_base_amount).greaterThanOrEqualTo(route.amount.value)) {
                            const value = new decimal(route.amount.value).div(order['limit_price'])
                            partial = partial.plus(value)
                            console.log('added value', value.toFixed(lot_decimals))
                            
                        }
                        else {
                            const value = new decimal(route.amount.value).div(order['limit_price'])
                            partial = partial.plus(filled_quote_amount)
                            console.log('added ', filled_base_amount.toFixed(lot_decimals))
                            
                        }
                    }


                    filled_base_total = new decimal(filled_base_total).plus(filled_base_amount)
                    filled_quote_total = new decimal(filled_quote_total).plus(filled_quote_amount)


                    console.log('filled_base', 
                        'order:', filled_base_amount.toFixed(lot_decimals), route.book.base, 
                        'total:', filled_base_total.toFixed(lot_decimals), route.book.base
                    )
                    console.log('filled_quote', 
                        'order:', filled_quote_amount.toFixed(lot_decimals), route.book.quote, 
                        'total:', filled_quote_total.toFixed(lot_decimals), route.book.quote
                    )

                    console.log('partial', 
                        partial.toFixed(lot_decimals), 
                        (route.amount.inverted) ? route.book.base : route.book.quote,
                        'liquidation',
                        route.amount.value,
                        route.amount.base,
                        route.amount.inverted
                    )
                    
                    last_order_price = order['limit_price']


                    if (route.amount.inverted) {
                        if (filled_quote_total.greaterThanOrEqualTo(route.amount.value)) {
                            liquidated = true
                            break
                        }
                    }

                    if (!route.amount.inverted) {
                        if (filled_base_total.greaterThanOrEqualTo(route.amount.value)) {
                            liquidated = true
                            break
                        }
                    }                    
                }

                const result = {
                    amount_liquidated: {
                        amount: route.amount.value,
                        currency: (!route.amount.inverted) ? route.book.base : route.book.quote
                    },
                    orders,
                    mid_price: this.midPrice(book),
                    book: route.exchange.key,
                    //amount: new decimal(amount_decimal).lessThanOrEqualTo(0) ? filled.toFixed(market_data.lot_decimals) : 0,
                    amount: partial.toFixed(lot_decimals), //tally.toFixed(lot_decimals),
                    currency: (route.amount.inverted) ? route.book.base : route.book.quote,
                    liquidated,
                    slippage: this.spreadPercent(book, last_order_price)
                }
                console.log('result', result)
                return result
            },
            //AKA market buy
            bookBuy(route, feeSwitch) {
                // console.log('liquidateHop --- bookBuy', route)
                const lot_decimals = route.exchange.market_data.lot_decimals
                let amount_decimal = new decimal(route.amount.value)
                let filled = new decimal(0)
                let order_count = 0
                let last_order_price = 0
                let trades = []
                const book = $store.getters.getBookExchange(route.exchange.key)

                for (let index = 0; index < book.asks.length; index++) {
                    order_count++
                    const order =  book.asks[index]

                    let filled_value1 = new decimal(amount_decimal).div(order['limit_price'])
                    if (!route.amount.inverted) {
                        filled_value1 = new decimal(amount_decimal).mul(order['limit_price'])
                    }
                    
                    let filled_value2 = new decimal(order['amount'])
                    // console.log('order', order, route.exchange.key)
                    // console.log('filled_value1', filled_value1.toFixed(lot_decimals))
                    // console.log('filled_value2', filled_value2.toFixed(lot_decimals))

                    let filled_amount = 0
                    if (!route.amount.inverted) {
                        filled_amount = new decimal(order['amount']).div(order['limit_price'])
                    }
                    else {
                        filled_amount = new decimal(order['amount']).mul(order['limit_price'])
                    }


                    if (filled_value1.lessThanOrEqualTo(filled_value2)) {
                        filled = new decimal(filled).plus(filled_value1)
                    }
                    else {
                        filled = new decimal(filled).plus(filled_value2)
                    }
                    trades.push({
                        base: route.book.base,
                        quote: route.book.quote,
                        filled_amount: filled_amount.toFixed(lot_decimals),
                        limit_price: order['limit_price'],
                        amount: order['amount'],
                        side: (route.amount.inverted) ? 'buy' : 'sell'
                    })
                    // console.log('filled_amount', filled_amount.toFixed(lot_decimals))
                    amount_decimal = new decimal(amount_decimal).minus(filled_amount)
                    
                    // console.log('running', amount_decimal.toFixed(lot_decimals))

                    last_order_price = order['limit_price']
                    if (new decimal(amount_decimal).lessThanOrEqualTo(0)) {
                        break
                    }
                }
                const liquidated = new decimal(amount_decimal).lessThanOrEqualTo(0)
                let trade_fee = new decimal(0)
                // switch on fee
                
                if (feeSwitch) {
                    const fee = new decimal(route.exchange.market_data.trade_fee).div(100)
                    trade_fee = filled.mul(fee)
                    filled = filled.minus(trade_fee)
                }

                const result = {
                    amount_liquidated: {
                        amount: route.amount.value,
                        currency: route.book.quote,
                        liquidated: liquidated,
                        order_min: route.exchange.market_data.ordermin,
                        ordermin_base: route.exchange.market_data.ordermin_base
                    },
                    order_count,
                    mid_price: this.midPrice(book),
                    book: route.exchange.key,
                    amount: (liquidated) ? filled.toFixed() : 0,
                    currency: route.book.base, 
                    fee: trade_fee.toFixed(),
                    trades: trades,
                    // amount_decimal: amount_decimal.toFixed(lot_decimals),
                    slippage: this.spreadPercent(book, last_order_price)
                }
                // console.log('result bookBuy', result)
                return result
            },
            //AKA market sell
            bookSell(route, feeSwitch) {
                // console.log('liquidateHop --- bookSell', route)
                const lot_decimals = route.exchange.market_data.lot_decimals
                let amount_decimal = new decimal(route.amount.value)
                let filled = new decimal(0)
                let order_count = 0
                let last_order_price = 0
                let trades = []
                const book = $store.getters.getBookExchange(route.exchange.key)                

                for (let index = 0; index < book.bids.length; index++) {
                    order_count++
                    const order =  book.bids[index]

                    let filled_value1 = new decimal(amount_decimal).div(order['limit_price'])
                    if (!route.amount.inverted) {
                        filled_value1 = new decimal(amount_decimal).mul(order['limit_price'])
                    }
                    
                    let filled_value2 = new decimal(order['amount']).mul(order['limit_price'])
                    // console.log('order', order, route.exchange.key)
                    // console.log('filled_value1', filled_value1.toFixed(lot_decimals))
                    // console.log('filled_value2', filled_value2.toFixed(lot_decimals))

                    let filled_amount = 0
                    if (!route.amount.inverted) {
                        filled_amount = new decimal(order['amount'])
                    }else {
                        filled_amount = new decimal(order['amount']).div(order['limit_price'])
                    }

                    if (filled_value1.lessThanOrEqualTo(filled_value2)) {
                        filled = new decimal(filled).plus(filled_value1)
                    }
                    else {
                        filled = new decimal(filled).plus(filled_value2)
                    }
                    trades.push({
                        base: route.book.base,
                        quote: route.book.quote,
                        filled_amount: filled_amount.toFixed(lot_decimals),
                        limit_price: order['limit_price'],
                        amount: order['amount'],
                        side: (route.amount.inverted) ? 'buy' : 'sell'
                    })

                    amount_decimal = new decimal(amount_decimal).minus(filled_amount)
                    
                    // console.log('running', amount_decimal.toFixed(lot_decimals))

                    if (new decimal(amount_decimal).lessThanOrEqualTo(0)) {
                        break
                    }
                }
                const liquidated = new decimal(amount_decimal).lessThanOrEqualTo(0)
                let trade_fee = new decimal(0)
                // switch on fee

                if (feeSwitch) {
                    const fee = new decimal(route.exchange.market_data.trade_fee).div(100)
                    trade_fee = filled.mul(fee)
                    filled = filled.minus(trade_fee)
                }

                const result = {
                    amount_liquidated: {
                        amount: route.amount.value,
                        currency: route.book.base,
                        liquidated: liquidated,
                        order_min: route.exchange.market_data.ordermin,
                        ordermin_base: route.exchange.market_data.ordermin_base
                    },
                    order_count,
                    mid_price: this.midPrice(book),
                    book: route.exchange.key,
                    amount: (liquidated) ? filled.toFixed() : 0,
                    currency: route.book.quote,
                    fee: trade_fee.toFixed(),
                    trades: trades,
                    // amount_decimal: amount_decimal.toFixed(lot_decimals),
                    slippage: this.spreadPercent(book, last_order_price)
                }
                // console.log('result bookSell', result)
                return result
            },

            

            midPrice(book) {
                if (book.bids.length == 0) { return 0 }
                return (new decimal(book.bids[0].limit_price).plus(book.asks[book.asks.length-1].limit_price)).div('2').toFixed(8)
            },
            spreadPercent(book, last_order_price) {
                const mid = this.midPrice(book)
                const x = new decimal(mid).minus(last_order_price).toFixed(8)
                return decimal.mul(x, '100').div(mid).toFixed(8)
            }
        })
    }
}


export default OrderBook