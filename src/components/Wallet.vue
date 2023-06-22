<template>
  <div class="row">
    <div class="col">
      <div v-if="'cex' in wallet" class="p-5 mb-4 rounded-3" :class="enviromentClasses(enviroment)">
        <div class="p-0 container-fluid py-0">
            <h2>Wallet Cex</h2>
            <hr/>
            <p>balance: {{numeralFormat(wallet.cex.base.balance, '0,0[.]000000000')}}  {{wallet.cex.base.currency}}</p>
            <p>balance:  {{numeralFormat(wallet.cex.quote.balance, '0,0[.]000000000')}}  {{wallet.cex.quote.currency}}</p>
            <hr/>
            <p>available: {{numeralFormat(wallet.cex.base.available, '0,0[.]000000000')}}  {{wallet.cex.base.currency}}</p>
            <p>available:  {{numeralFormat(wallet.cex.quote.available, '0,0[.]000000000')}}  {{wallet.cex.quote.currency}}</p>
            <hr/>
            <p>Liquidity Sell:  {{numeralFormat(liquidity.LimitSellCex, '0,0[.]000000000')}}  {{wallet.dex.base.currency}}</p>
            <p>Liquidity Buy: {{numeralFormat(liquidity.LimitBuyCex, '0,0[.]000000000')}}  {{wallet.dex.base.currency}}</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div v-if="'dex' in wallet" class="p-5 mb-4 rounded-3" :class="enviromentClasses(enviroment)">
        <div class="p-0 container-fluid py-0">
            <h2>Wallet Dex</h2>
            <hr/>
            <p>balance: {{numeralFormat(wallet.dex.base.balance, '0,0[.]000000000')}} {{wallet.dex.base.currency}}</p>
            <p>balance: {{numeralFormat(wallet.dex.quote.balance, '0,0[.]000000000')}}  {{wallet.dex.quote.currency}}</p>
            <hr/>
            <p>available: {{numeralFormat(wallet.dex.base.available, '0,0[.]000000000')}}  {{wallet.dex.base.currency}}</p>
            <p>available:  {{numeralFormat(wallet.dex.quote.available, '0,0[.]000000000')}}  {{wallet.dex.quote.currency}}</p>
            <hr/>
            <p>Liquidity Sell:  {{numeralFormat(liquidity.LimitSellDex, '0,0[.]000000000')}}  {{wallet.dex.base.currency}}</p>
            <p>Liquidity Buy: {{numeralFormat(liquidity.LimitBuyDex, '0,0[.]000000000')}}  {{wallet.dex.base.currency}}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'WalletComponent',
    props: ['enviroment', 'dex_account_base', 'dex_account_quote', 'cex_account_base', 'cex_account_quote', 'liquidity'],
    data() {     
        return {
            wallet: {}
        }
    },
    updated() {
        if ('dex' in this.wallet) {
            if (this.wallet.cex.base.balance != this.cex_account_base.balance ||
                this.wallet.cex.quote.balance != this.cex_account_quote.balance ||
                this.wallet.dex.base.balance != this.dex_account_base.balance ||
                this.wallet.dex.quote.balance != this.dex_account_quote.balance) {
                this.loadData()
            }
        }
        else {
            this.loadData()
        }
    },
    mounted() {
        if (!('dex' in this.wallet)) {
            this.loadData()
        }
    },
    methods: {

        "enviromentClasses": function enviromentClasses(value) {
            if (value == 'production') {
                return 'purple-background'
            }
            return 'green-background'
        },
        loadData() {
            this.wallet.dex = {
                base: this.dex_account_base,
                quote: this.dex_account_quote,
            }
            this.wallet.cex = {
                base: this.cex_account_base,
                quote: this.cex_account_quote,
            }
        }
    }
}
</script>


<style scoped>
.bg-light {
  color: #000000;
}

.green-background {
  color: #FFFFFF;
  background-color: #00e56a;
}

.orange-background {
  color: #FFFFFF;
  background-color: #ff931a;
}

.purple-background {
  color: #FFFFFF;
  background-color: #974cff;
}
</style>
