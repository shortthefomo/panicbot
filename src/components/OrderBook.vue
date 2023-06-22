
<template>
    <h3><span class="glyphicon" :class="checkNetwork(connected)"></span> <span class="display-8 fw-bold">{{exchange_name}} {{base}} </span></h3>
    <div v-if="book != null && book.bids.length>0 || book.asks.length>0" :class="'p-0 mb-4 dark-background rounded-3 border border-3 ' + (selected == exchange_key ? 'border-purple': 'border-dark')">
        <div class="p-2 mb-2 mt-2 container-fluid">
            <!-- eslint-disable-next-line -->
            <div class="asks mx-1 row" v-for="(row, index) in book.asks.slice(10 - items, 10)">
                <span class="depth" :style="'transform:scale3d(' + ask_depth(index) + ', 1, 1) ;'"> </span>
                <div class="col">{{format(row['limit_price'])}} {{quote}}</div>
                <div class="col">{{numeralFormat(row['amount'], '0,0[.]00000000')}}</div>
                <div class="col address" v-if="show_addresses"><small>{{row['address']}}</small></div>
            </div>


            <!-- <table v-if="book.asks.length>0" class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th>amount</th>
                        <th v-if="show_addresses">address</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in book.asks.slice(10 - items, 10)">
                        <td scope="row" class="table-success-opaque"><div class="row-overlay"></div>{{format(row['limit_price'])}} {{quote}}</td>
                        <td scope="row" class="table-success-opaque">{{numeralFormat(row['amount'], '0,0[.]00000000')}}</td>
                        <td v-if="show_addresses" scope="row" class="table-success-opaque"><small>{{row['address']}}</small></td>
                    </tr>
                </tbody>
            </table> -->
            <h4 class="my-1 mx-1">{{format( midPrice())}} {{quote}}</h4>

            <!-- eslint-disable-next-line -->
            <div class="bids mx-1 row" v-for="(row, index) in book.bids.slice(0, items)">
                <span class="depth" :style="'transform:scale3d(' + bid_depth(index) + ', 1, 1) ;'"> </span>
                <div class="col">{{format(row['limit_price'])}} {{quote}}</div>
                <div class="col">{{numeralFormat(row['amount'], '0,0[.]00000000')}}</div>
                <div class="col address" v-if="show_addresses"><small>{{row['address']}}</small></div>
            </div>

            <!-- <table  v-if="book.bids.length>0" class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th>amount</th>
                        <th v-if="show_addresses">address</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in book.bids.slice(0, items)">
                        <td scope="row" class="table-danger-opaque">{{format(row['limit_price'])}} {{quote}}</td>
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['amount'], '0,0[.]00000000')}}</td>
                        <td v-if="show_addresses" scope="row" class="table-danger-opaque"><small>{{row['address']}}</small></td>
                    </tr>
                </tbody>
            </table> -->
            <div class="info mx-1 mt-4">
                <h6 v-if="book.asks.length>0 && book.bids.length>0">spread: {{(spread())}} {{quote}} : {{ format(spreadPercent()) }} % </h6>
                <h6 v-if="book.asks.length>0"><span class="color-success">asks: {{numeralFormat(asks(), '0,0[.]0')}} {{base}}</span> </h6>
                <h6 v-if="book.bids.length>0"><span class="color-danger">bids: {{numeralFormat(bids(), '0,0[.]0')}} {{base}}</span></h6>
            </div>
            <button v-if="hasChart" type="button" v-on:click="selectExchange" class="btn btn-purple me-1">select</button>
            <button v-if="exchange_name.split('-')[0] == 'dex'" v-on:click="showAddresses" type="button" class="btn btn-warning me-1">toggle address</button>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */
    import { debounce } from 'lodash'
    import decimal from 'decimal.js'

    export default {
        name: "OrderBook",
        emits: ['exchange_selected'],
        props: ['bot', 'exchange_key', 'exchange_name', 'show', 'info', 'base', 'quote', 'items', 'selected'],
        data() {
            return {
                lastupdate: new Date().getTime(),
                isLoading: true,
                exchange : null,
                show_addresses: false,
                debouncedBook: null,
                bookSkipCount: 0,
                book: {
                    bids: [],
                    asks: []
                }
            }
        },
        created() {
            if (this.debouncedBook != null) { return }
            this.debouncedBook = debounce(data => {
                const result = {
                    asks: [...data.asks].reverse(),
                    bids: [...data.bids],
                }
                this.bookSkipCount = 0
                // only update the book if they are different!
                if (JSON.stringify(result) === JSON.stringify(this.book)) { return }
                this.book = result
                
            }, 100)
            console.log('debouncedBook: ' + this.exchange_key)
        },
        beforeUnmount() {
            if (this.debouncedBook == null) { return }
            this.debouncedBook.cancel()
        },
        mounted() {
            console.log('in book render: ' + this.exchange_key)
            this.load()
            if (this.isLoading) { 
                this.isLoading = false
            }
        },
        computed: {
            hasChart() {
                return this.exchange.hasChart()
            },
            exchangeBook() {
                if (this.exchange_key == null) { return { bids: [], asks: [] }}
                return this.$store.getters.getBookExchange(this.exchange_key)
            },
            connected() {
                if (this.exchange_key == null) { return { bids: [], asks: [] }}
                return this.$store.getters.getConnected(this.exchange_key)
            }
        },
        watch: {
            exchangeBook(newValue) {
                this.bookSkipCount++
                if (this.bookSkipCount > 50) {
                    this.book = {
                        asks: [...newValue.asks].reverse(),
                        bids: [...newValue.bids],
                    }
                    this.bookSkipCount = 0
                }
                else {
                    this.debouncedBook(newValue)
                }
            },
            connected(connection) {
                if (!connection) {
                    this.book = {
                        bids: [],
                        asks: []
                    }
                }
            }
        },
        methods: {
            load() {
                const exchanges = this.bot.getExchanges()
                for (let index = 0; index < exchanges.length; index++) {
                    const exchange = exchanges[index]
                    if (this.exchange_key == exchange.getKey()) {
                        this.exchange = exchange
                    }
                }
            },
            selectExchange() {
                this.$emit('exchange_selected', this.exchange_key)
            },
            bid_depth(index2) {
                let sum = 0
                for (let index = 0; index <= index2; index++) {
                    sum += this.book.bids[index].amount *1
                }
                const total = this.bids()
                
                return sum / total
            },
            ask_depth(index2) {
                let sum = 0
                for (let index = this.book.asks.length -1; index >= index2; index--) {
                    sum += this.book.asks[index].amount *1
                }

                const total = this.asks()
                
                return sum / total
            },
            bids() {
                let total = 0
                for (let index = 0; index < this.book.bids.length; index++) {
                    total += this.book.bids[index].amount *1
                }
                return total
            },
            asks() {
                let total = 0
                for (let index = 0; index < this.book.asks.length; index++) {
                    total += this.book.asks[index].amount *1 
                }
                return total
            },
            spread() {
                if (this.book.asks.length == 0 || this.book.bids.length == 0) { return 0 }
                //return new decimal(this.book.asks[0].limit_price).toFixed(8)
                const value = new decimal(this.book.asks[this.book.asks.length-1].limit_price).minus(this.book.bids[0].limit_price).toFixed(8)
                if ((value*1)< 1) {
                    return value
                }
               return new decimal(this.book.asks[this.book.asks.length-1].limit_price).minus(this.book.bids[0].limit_price).toFixed(2)
            },
            spreadPercent() {
                return decimal.mul(this.spread(), '100').div(this.midPrice())
            },
            midPrice() {
                if (this.book.bids.length == 0) { return 0 }
                // return new decimal(this.book.bids[0].limit_price).toFixed(8)
                return (new decimal(this.book.bids[0].limit_price).plus(this.book.asks[this.book.asks.length-1].limit_price)).div('2')
            },
            showAddresses() {
                console.log('show_addresses clicked...')
                this.show_addresses = !this.show_addresses
            },
            checkNetwork(network) {
                if (network) {
                    return 'one-fine-green-dot'
                } else {
                    return 'one-fine-red-dot'
                }
            },
            arbitrage(value) {
                if (value) {
                    return 'table-arb-opaque'
                }
            },
            format(value) {
                if ((value*1) > 10) {
                    return this.numeralFormat(value, '0,0[.]00')
                }
                return this.numeralFormat(value, '0,0[.]00000000')
            },
            boostrapTableClasses(rate, side) {
                switch (side) {
                    case 'high':
                        if (this.data.rate > rate) {
                            return 'table-danger-opaque'
                        }
                        return 'table-danger-opaque'
                    case 'low':
                        if (this.data.rate < rate) {
                            return 'table-danger-opaque'
                        }
                        return 'table-danger-opaque'  
                    default:
                        return 'table-danger-opaque'
                }
            }
        },
    }
</script>

<style>
.asks, .bids {
    position: relative;
}
.asks .depth {
    position: absolute;
    background-color: rgba(0, 229, 106, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
}

.bids .depth {
    position: absolute;
    background-color: rgba(255, 26, 139, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
}

.asks .col {
    color: #00e56a;
}
.bids .col {
    color: #FF1A8B;
    
}
.bids .address, .asks .address {
    width: 325px;
    text-align: right;
}

.table-success {
    --bs-table-bg: #00e56a;
    --bs-table-striped-bg: #00e56a;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #00e56a;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #00e56a;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #00e56a;
}

.table-danger {
    --bs-table-bg: #FF1A8B;
    --bs-table-striped-bg: #FF1A8B;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #FF1A8B;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #FF1A8B;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #FF1A8B;
}

.table-success-opaque {
    --bs-table-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(0, 229, 106, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(0, 229, 106, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(0, 229, 106, 0.6);
}

.table-danger-opaque {
    --bs-table-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 26, 139, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 26, 139, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 26, 139, 0.6);
}

.color-danger {
    color: #FF1A8B;
}
.color-success {
    color:#00e56a;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
}

.border-purple.rounded-3 {
    border-color: rgba(116, 62, 226, 0.6) !important;
}

.table-arb-opaque {
  --bs-table-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-color: #000;
  --bs-table-active-bg: rgba(116, 62, 226, 0.6);
  --bs-table-active-color: #000;
  --bs-table-hover-bg: rgba(116, 62, 226, 0.6);
  --bs-table-hover-color: #000;
  color: #FFFFFF !important;
  border-color: rgba(116, 62, 226, 0.6);
}

.table-warning-opaque {
    --bs-table-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 193, 7, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 193, 7, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 193, 7, 0.6);
}
</style>