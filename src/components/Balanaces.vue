<template>
    <!-- eslint-disable-next-line -->
    <div v-for="(leg, exchange) in balances" class="col-2">
        <h2>{{exchange}}</h2>
        <ul>
            <!-- eslint-disable-next-line -->
            <li v-for="(value, currency) in leg">{{currency}} {{value}}</li>
        </ul>
    </div>
</template>

<script>
    /* eslint-disable */

    export default {
        name: 'Balanaces',
        props: ['routes'],
        data() {
            return {
                legs: {},
                balances: {},
                isLoading: true,
            }
        },
        mounted() {
            this.legs = {}
            for (let index = 0; index < this.routes.length; index++) {
                const route = this.routes[index]
                if (!(route.name in this.legs)) {
                    this.legs[route.name] = {}
                }
                this.legs[route.name][route.quote] = { 
                    key: route.key,
                    balance: 0
                }
                this.legs[route.name][route.base] = { 
                    key: route.key,
                    balance: 0
                }
            }
        },
        computed: {
            balance() {
                const balances = {}
                for (let index = 0; index < this.routes.length; index++) {
                    const route = this.routes[index]
                    balances[route.key] = this.$store.getters.getBalances(route.key)
                    balances[route.key]['name'] = route.name
                }
                return balances
            }
        },
        watch: {
            balance(newValue) {
                for (let index = 0; index < this.routes.length; index++) {
                    const route = this.routes[index]
                    if (!(route.name in this.balances)) {
                        this.balances[route.name] = {}
                    }
                    
                }
                for (const exchange_key in newValue) {
                    for (const currency in newValue[exchange_key]) {
                        const name = newValue[exchange_key].name
                        
                        if (!(currency in this.balances[name]) && currency != 'name'){
                            this.balances[name][currency] = newValue[exchange_key][currency]
                        }
                    }
                }
            }
        },
        methods: {
        }
    }
</script>

<style scoped>
.webgl.contained {
    width: auto !important;
}
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