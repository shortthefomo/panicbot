<template>
    <div v-if="rows.buy.length>0 || rows.sell.length>0" class="p-0 mb-4 dark-background rounded-3">
        <div class="p-2 mb-4 container-fluid">
            <h1 class="display-5 fw-bold">Open Offers {{side}}</h1>
            <table v-if="rows.sell.length>0" class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th v-if="show">converted</th>
                        <th>amount</th>
                        <th v-if="side == 'DEX'">expired</th>
                        <th v-if="side == 'DEX'">flags</th>
                        <th v-if="side != 'DEX' && info">id</th>
                        <th v-if="side == 'DEX' && info">seq</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows.sell" :key="row.id">
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['limit_price'], '0,0[.]00000')}}</td>
                        <td v-if="show && side == 'DEX'" scope="row" class="table-danger-opaque">{{numeralFormat((row['limit_price'] / (1/rate)), '0,0[.]00000')}}</td>
                        <td v-if="show && side != 'DEX'" scope="row" class="table-danger-opaque">{{numeralFormat((row['limit_price'] / rate), '0,0[.]00000')}}</td>
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['amount'], '0,0[.]00000')}}</td>
                        <td v-if="side == 'DEX'" scope="row" class="table-danger-opaque" :class="expired(row['expired'])">{{row['expiration'] - ledgerEpoch()}} sec</td>
                        <td v-if="side == 'DEX'" scope="row" class="table-danger-opaque">{{row['flags']}}</td>
                        <td v-if="side != 'DEX'&& info" scope="row" class="table-danger-opaque">{{row['id']}}</td>
                        <td v-if="side == 'DEX'&& info" scope="row" class="table-danger-opaque">{{row['seq']}}</td>
                    </tr>
                </tbody>
            </table>

            <table v-if="rows.buy.length>0" class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th v-if="show">converted</th>
                        <th>amount</th>
                        <th v-if="side == 'DEX'">expired</th>
                        <th v-if="side == 'DEX'">flags</th>
                        <th v-if="side != 'DEX'&& info">id</th>
                        <th v-if="side == 'DEX'&& info">seq</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows.buy" :key="row.id">
                        <td scope="row" class="table-success-opaque">{{numeralFormat(row['limit_price'], '0,0[.]00000')}}</td>
                        <td v-if="show && side == 'DEX'" scope="row" class="table-success-opaque">{{numeralFormat((row['limit_price']/ (1/rate)), '0,0[.]00000')}}</td>
                        <td v-if="show && side != 'DEX'" scope="row" class="table-success-opaque">{{numeralFormat((row['limit_price'] / rate), '0,0[.]00000')}}</td>
                        <td scope="row" class="table-success-opaque">{{numeralFormat(row['amount'], '0,0[.]00000')}}</td>
                        <td v-if="side == 'DEX'" scope="row" class="table-success-opaque" :class="expired(row['expired'])">{{row['expiration'] - ledgerEpoch()}} sec</td>
                        <td v-if="side == 'DEX'" scope="row" class="table-success-opaque">{{row['flags']}}</td>
                        <td v-if="side != 'DEX'&& info" scope="row" class="table-success-opaque">{{row['id']}}</td>
                        <td v-if="side == 'DEX'&& info" scope="row" class="table-success-opaque">{{row['seq']}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
    export default {
        name: "OpenOffers",
        props: ['data', 'show', 'info', 'side', 'rate'],
        data() {
            return {
                last: null,
                rows: {
                    buy: [],
                    sell: []
                },
                isLoading: true
            }
        },
        async updated() {
            if (this.last != this.data) {
                this.loadData()
            }
        },
        async mounted() {
            
        },
        methods: {
            "loadData": async function loadData() {
                this.last = this.data
                if (this.side == 'DEX') {
                    const flags = {
                        0: 'none',
                        65536: 'tfPassive',
                        131072: 'tfImmediateOrCancel',
                        262144: 'tfFillOrKill',
                        524288: 'tfSell'
                    }

                    const sell = []
                    for (let index = 0; index < this.data.sell.length; index++) {
                        const element = this.data.sell[index]
                        sell.push({
                            limit_price: element.taker_pays.value / (element.taker_gets / 1_000_000),
                            currency_quote: element.taker_pays.currency,
                            currency_base: 'XRP',
                            amount: element.taker_gets / 1_000_000,
                            expired: (this.ledgerEpoch() > element.expiration) ? true: false,
                            expiration: element.expiration,
                            flags: flags[element.flags],
                            seq: element.seq
                        })
                        
                    }

                    sell.sort((a,b) => (a.limit_price < b.limit_price) ? 1 : ((b.limit_price < a.limit_price) ? -1 : 0))
                    this.rows.sell = sell
                    
                    const buy = []
                    for (let index = 0; index < this.data.buy.length; index++) {
                        const element = this.data.buy[index]
                        buy.push({
                            amount: element.taker_pays / 1_000_000,
                            currency_quote: element.taker_gets.currency,
                            currency_base: 'XRP',
                            limit_price: element.taker_gets.value / (element.taker_pays / 1_000_000),
                            expired: (this.ledgerEpoch() > element.expiration) ? true: false,
                            expiration: element.expiration,
                            flags: flags[element.flags],
                            seq: element.seq
                        })
                    }
                    buy.sort((a,b) => (a.limit_price < b.limit_price) ? 1 : ((b.limit_price < a.limit_price) ? -1 : 0))
                    this.rows.buy = buy
                }
                else {
                    const sell = []
                    for (let index = 0; index < this.data.sell.length; index++) {
                        const element = this.data.sell[index]
                        sell.push({
                            limit_price: element.limit_price,
                            currency_base: 'XRP',
                            currency_quote: element.taker_pays_currency,
                            amount: element.amount,
                            id: element.id
                        })
                    }

                    sell.sort((a,b) => (a.limit_price < b.limit_price) ? 1 : ((b.limit_price < a.limit_price) ? -1 : 0))
                    this.rows.sell = sell


                    const buy = []
                    for (let index = 0; index < this.data.buy.length; index++) {
                        const element = this.data.buy[index]
                        buy.push({
                            limit_price: element.limit_price,
                            currency_quote: element.taker_pays_currency,
                            currency_base: 'XRP',
                            amount: element.amount,
                            id: element.id
                        })
                    }
                    buy.sort((a,b) => (a.limit_price > b.limit_price) ? 1 : ((b.limit_price > a.limit_price) ? -1 : 0))
                    this.rows.buy = buy
                }
                
                this.isLoading = false
            },
            "ledgerEpoch": function ledgerEpoch() {
                const unix_time = Date.now() 
                return Math.floor((unix_time) / 1000) - 946684800
            },
            "arbitrage": function arbitrage(value) {
                if (value) {
                    return 'table-arb-opaque'
                }
            },
            "expired": function expire(value) {
                if (value) {
                    return 'table-warning-opaque'
                }
            }
        },
        computed: {
            "expire_check": function expire_check(expiration) {
                const unix_time = Date.now() 
                const epoch = Math.floor((unix_time) / 1000) - 946684800
                if (epoch > expiration) {
                    return true
                }
                return expiration - epoch
            },
            "columnsLow": function columnsLow() {
                if (this.data.sell == undefined) { return []}
                if (this.data.sell.length == 0) {
                    return []
                }
                return Object.keys(this.data.sell[0]).filter( code => code !== 'id').filter( code => code !== 'arbitrage')
            },
            "columnsHigh": function columnsHigh() {
                if (this.data.buy == undefined) { return []}
                if (this.data.buy.length == 0) {
                    return []
                }
                return Object.keys(this.data.buy[0]).filter( code => code !== 'id').filter( code => code !== 'arbitrage')
            },
        }
    }
</script>

<style scoped>
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