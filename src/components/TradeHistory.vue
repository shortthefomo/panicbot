<template>
    <!-- <h2 class="display-8 fw-bold">Trade History</h2> -->
    <div v-if="history.length>0" class="p-0 mb-0 dark-background trade-history rounded-3">
        <div class="p-2 container-fluid">
            <table class="table">
                <thead class="table-dark">
                    <tr>
                        <th>exchange</th>
                        <th>side</th>
                        <th>limit price</th>
                        <th>amount</th>
                        <th>value</th>
                        <th v-if="show">conversion</th>
                        <th>time</th>
                        <!-- <th v-if="info">maker</th>
                        <th v-if="info">taker</th>
                        <th v-if="info && side == 'DEX'">hash</th> -->
                    </tr>
                </thead>
                <tbody>
                    <!-- eslint-disable-next-line -->
                    <tr v-for="row in history.slice(0, items)">
                        <td :class="colorTrade(row['color'])" scope="row">{{row['exchange']}}</td>
                        <td :class="colorTrade(row['color'])" scope="row">{{row['side']}}</td>
                        <td :class="colorTrade(row['color'])" scope="row">{{numeralFormat(row['limit_price'], '0,0[.]00000000')}} {{row['quote']}}</td>
                        <td :class="colorTrade(row['color'])" scope="row">{{numeralFormat(row['amount'], '0,0[.]00000000')}} {{row['base']}}</td>
                        <td :class="colorTrade(row['color'])" scope="row">{{numeralFormat(row['amount'] * row['limit_price'], '0,0[.]00000000')}} {{row['quote']}}</td>
                        <td v-if="show" :class="colorTrade(row['color'])" scope="row">{{numeralFormat(row['limit_price_converted'], '0,0[.]00000000')}} </td>
                        <td :class="colorTrade(row['color'])" scope="row">{{this.adjustTime(row['timestamp'])}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>


<script>
    import {debounce} from 'lodash'

    export default {
        name: "TradeHistory",
        props: ['enviroment', 'items'],
        data() {
            return {
                lastupdate: new Date().getTime(),
                isLoading: true,
                debouncedHistory: null,
                historySkipCount: 0,
                history: [],
                show: false
            }
        },
        created() {
            if (this.debouncedHistory != null) { return }
            this.debouncedHistory = debounce(data => {
                const result = [...data]
                this.historySkipCount = 0

                // only update the history if they are different!
                if (JSON.stringify(result) === JSON.stringify(this.history)) { return }
                this.history = result
                
            }, 50)
            console.log('debouncedHistory')
        },
        beforeUnmount() {
            if (this.debouncedHistory == null) { return }
            this.debouncedHistory.cancel()
        },
        mounted() {
            console.log('in history render')
            if (this.isLoading) { 
                this.isLoading = false
            }
        },
        computed: {
            historyExchange() {
                return this.$store.getters.getHistoryAll
            }
        },
        watch: {
            historyExchange(newValue) {
                this.historySkipCount++
                if (this.historySkipCount > 20) {
                    this.history = [...newValue]
                    this.historySkipCount = 0
                }
                else {
                    this.debouncedHistory(newValue)
                }
            }
        },
        methods: {
            adjustTime(time) {
                const offset = (-1) * new Date(time).getTimezoneOffset() * 60000
                const stamp = Math.round(new Date((time *1000 )+ offset).getTime() / 1000)
                return new Date(stamp).toString().split(' ')[4]
            },
            "colorTrade": function colorTrade(value) {
                if (value == 'sell') {
                    return 'color-danger'
                } else if (value == 'buy') {
                    return 'color-success'
                }
                return 'color-warning '
            }
        },
    }
</script>

<style scoped>
.trade-history {
    display: block;
    overflow-y: scroll;
    height: 520px;
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
.color-warning {
    color: #ffc107;
}
.color-white {
    color: #FFFFFF;
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