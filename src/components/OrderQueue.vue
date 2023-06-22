<template>
    <div v-if="rows.length>0" class="p-0 mb-4 dark-background rounded-3">
        <div class="p-2 mb-4 container-fluid">
            <h1 class="display-5 fw-bold">Order Queue {{side}}</h1>
            <table v-if="rows.length>0" class="table">
                <thead class="table-dark">
                    <tr>
                        <th>amount</th>
                        <th>delay</th>
                        <th>id</th>
                        <th>limit price</th>
                        <th>converted</th>
                        <th>recipricate</th>
                        <th>side</th>
                        <th>timestamp</th>
                        <th>type</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows" :key="row.id">
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['amount']/1_000_000, '0,0[.]00000')}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['delay']}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['id']}}</td>
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['limit_price'], '0,0[.]00000')}}</td>
                        <td scope="row" class="table-danger-opaque">{{numeralFormat(row['limit_price_converted'], '0,0[.]00000')}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['recipricate']}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['side']}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['timestamp']}}</td>
                        <td scope="row" class="table-danger-opaque">{{row['type']}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
    export default {
        name: "OrderQueue",
        props: ['data', 'show', 'info', 'side', 'rate'],
        data() {
            return {
                last: null,
                rows: [],
                isLoading: true
            }
        },
        async updated() {
            if (this.rows != this.data) {
                this.loadData()
            }
        },
        async mounted() {
            
        },
        methods: {
            "loadData": async function loadData() {
                this.rows = this.data

                
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