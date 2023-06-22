<template>
    <div class="p-0 mb-0 dark-background rounded-3">
        <div class="p-2 container-fluid py-0">
            <h1 class="display-5 fw-bold">Window {{side}}</h1>            
            <table  class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th>amount</th>
                        <th v-if="show">conversion</th>
                        <th>type</th>
                        <th>profitable</th>
                        <th>side</th>
                        <th v-if="info">percent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows.sell" :key="row.id" :class="arbitrage(row['arbitrage'])">
                        <td scope="row">{{numeralFormat(row['limit_price'], '0,0[.]00000')}} {{data.source}}</td>
                        <td scope="row">{{numeralFormat(row['amount']/1_000_000, '0,0[.]00000')}}</td>
                        <td v-if="show" scope="row">{{numeralFormat(row['limit_price_converted'], '0,0[.]00000')}} {{data.target}}</td>
                        <td scope="row">{{row['type']}}</td>
                        <td scope="row" :class="boostrapTableClasses(row['profitable'])">{{row['profitable']}}</td>
                        <td scope="row">{{row['side']}}</td>
                        <td v-if="info" scope="row">{{row['percent']}}</td>
                    </tr>
                </tbody>
            </table>
            <br/>
            <table  class="table">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th>amount</th>
                        <th v-if="show">conversion</th>
                        <th>type</th>
                        <th>profitable</th>
                        <th>side</th>
                        <th v-if="info">percent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows.buy" :key="row.id" :class="arbitrage(row['arbitrage'])">
                        <td scope="row">{{numeralFormat(row['limit_price'], '0,0[.]00000')}} {{data.source}}</td>
                        <td scope="row">{{numeralFormat(row['amount']/1_000_000, '0,0[.]00000')}}</td>
                        <td v-if="show" scope="row">{{numeralFormat(row['limit_price_converted'], '0,0[.]00000')}} {{data.target}}</td>
                        <td scope="row">{{row['type']}}</td>
                        <td scope="row" :class="boostrapTableClasses(row['profitable'])">{{row['profitable']}}</td>
                        <td scope="row">{{row['side']}}</td>
                        <td v-if="info" scope="row">{{row['percent']}}</td>
                    </tr>
                </tbody>
            </table>
             <p><small>possible offers calculated*</small></p>
        </div>
    </div>
</template>

<script>
    export default {
        name: "OfferWindow",
        props: ['data', 'show', 'info', 'side' ],
        data() {
            return {
                last_side: '',
                last: null,
                rows: {
                    buy: [],
                    sell: []
                },
                isLoading: true
            }
        },
        async updated() {
            if ((this.data.buy.length > 0 || this.data.sell.length > 0)&& this.last != this.data) {
                this.loadData()
            }
        },
        async mounted() {
            
        },
        methods: {
            "loadData": async function loadData() {
                this.last = this.data
                this.last_side = this.side
                this.rows.sell = this.data.sell
                const temp = [...this.data.buy]
                //const temp2 = this.data.buy.reverse()
                this.rows.buy = temp.reverse()
                this.isLoading = false
            },
            "arbitrage": function arbitrage(value) {
                if (value) {
                    return 'table-arb-opaque'
                }
            },
            "boostrapTableClasses": function boostrapTableClasses(value) {
                if (value) {
                    return 'table-success-opaque'
                }
                return 'table-danger-opaque'
            }
        },
        computed: {
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