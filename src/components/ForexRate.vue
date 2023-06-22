<template>
    <div v-if="book.bids.length > 0 && 'master' in route" class="col-4">
        <h2>{{exchange_name}}</h2>
        <h3>{{numeralFormat(midPrice, '0,0[.]00000')}} {{base}}{{quote}} </h3>
        <h5>{{numeralFormat(inverted, '0,0[.]00000')}} {{ratePair}} </h5>
    </div>
</template>

<script>
    /* eslint-disable */
    import { debounce } from 'lodash'
    import decimal from 'decimal.js'

    export default {
        name: 'ForexRate',
        props: ['route', 'exchange', 'exchange_name', 'pair', 'base', 'quote'],
        data() {
            return {
                lastupdate: new Date().getTime(),
                isLoading: true,
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
                if (JSON.stringify(result) === JSON.stringify(this.book)) { return {
                    bids: [],
                    asks: []
                }}
                this.book = result
                
            }, 100)
            console.log('debouncedBook fx: ' + this.exchange)
        },
        beforeUnmount() {
            if (this.debouncedBook == null) { return }
            this.debouncedBook.cancel()
        },
        mounted() {
            console.log('in fx render: ' + this.exchange)
            if (this.isLoading) { 
                this.isLoading = false
            }
        },
        computed: {
            inverted() {
                if (this.pair.substring(0, 3) == this.quote) {
                    return this.midPrice / (1/this.$store.getters.getFxRate)
                }
                return this.midPrice / (this.$store.getters.getFxRate)
            },
            ratePair()  {
                if (this.pair.substring(0, 3) == this.quote) {
                    return this.base + this.pair.substring(3, 6)
                }
                return this.base + this.pair.substring(0, 3)
            },
            midPrice() {
                if (this.book.bids.length <= 0 || this.book.asks.length <= 0) { return 0 }
                return (new decimal(this.book.bids[0].limit_price).plus(this.book.asks[this.book.asks.length-1].limit_price)).div('2')
            },
            exchangeBook() {
                if (this.exchange == null) { return {  bids: [], asks: [] }}
                return this.$store.getters.getBookExchange(this.exchange)
            },
            connected() {
                if (this.exchange == null) { return {  bids: [], asks: [] }}
                return this.$store.getters.getConnected(this.exchange)
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


        //     forexQuoteBook(newValue) {
        //         this.bookQuoteSkipCount++
        //         if (this.bookQuoteSkipCount > 20) {
        //             this.book.quote = {
        //                 asks: [...newValue.asks].reverse(),
        //                 bids: [...newValue.bids],
        //             }
        //             if (this.book.quote.bids.length > 0) { 
        //                 this.midPrice_quote = (new decimal(this.book.quote.bids[0].limit_price).plus(this.book.quote.asks[this.book.quote.asks.length-1].limit_price)).div('2')
        //             }
        //             this.bookQuoteSkipCount = 0
        //         }
        //         else {
        //             this.debouncedQuoteBookB(newValue)
        //         }
        //     },
        // },
    }
</script>

<style scoped>
input:disabled {
    color: -internal-light-dark(rgb(84, 84, 84), rgb(170, 170, 170));
    cursor: default;
    background-color: rgba(255, 255, 255, 0.64) !important;
    border-color: rgba(118, 118, 118, 0.6) !important;
}
.table {
    color: #FFFFFF;
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