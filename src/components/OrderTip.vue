
<template>
    <div v-if="ask != null && bid != null" class="p-0 mt-4 mb-4 dark-background rounded-3">
        <div class="p-2 mb-4 container-fluid">
            <div class="tip-top">
                <div class="row">
                    <div class="col">
                        <h1>{{numeralFormat(ask['limit_price'], '0,0[.]00000')}}</h1>
                    </div>
                    <div class="col">
                        <h1 class="text-end">{{numeralFormat(ask['limit_price_converted'], '0,0[.]00000')}}</h1>
                    </div>
                </div>
            </div>
            <div v-if="info"  class="tip-mid">
                <h6>{{numeralFormat(ask['amount'], '0,0[.]00000')}} </h6>
                <h3>{{numeralFormat(ask['limit_price_converted'], '0,0[.]00000')}} {{quote}}</h3>
            </div>
            <div class="row">
                <div class="col">
                    <p class="mb-0"> spread: {{numeralFormat(ask.limit_price - bid.limit_price, '0,0[.]00000')}} {{base}}</p>
                </div>
                <div class="col">
                    <p class="mb-0 text-end"> spread: {{numeralFormat(ask.limit_price_converted - bid.limit_price_converted, '0,0[.]00000')}} {{quote}}</p>
                </div>
            </div>
            
            
            <div class="tip-bottom">
                <div class="row">
                    <div class="col">
                        <h1>{{numeralFormat(bid['limit_price'], '0,0[.]00000')}}</h1>
                    </div>
                    <div class="col">
                        <h1 class="text-end">{{numeralFormat(bid['limit_price_converted'], '0,0[.]00000')}} </h1>
                    </div>
                </div>
            </div>
            <div v-if="info" class="tip-mid">
                <h6>{{numeralFormat(bid['amount'], '0,0[.]00000')}}</h6>
                <h3>{{numeralFormat(bid['limit_price_converted'], '0,0[.]00000')}} {{quote}}</h3>
            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */

    export default {
        name: "OrderTip",
        props: ['ask', 'bid', 'show', 'side', 'base', 'quote', 'info'],
        data() {
            return {
                copy: {
                    ask: 0,
                    bid: 0
                },
                lastupdate: new Date().getTime(),
                isLoading: true,
                allowUpdate: true
            }
        },
        updated() {
            this.loadData()
        },
        mounted() {
            if (this.isLoading) { 
                this.loadData()
                this.isLoading = false
            }
        },
        methods: {
            "loadData": function loadData() {
                if ((this.lastupdate + 400) > new Date().getTime()) { return }
                this.lastupdate = new Date().getTime()
            },
            "boostrapTableClasses": function boostrapTableClasses(rate, side) {
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

<style scoped>
tip-top {
    color: #FFFFFF;
    background-color: rgba(0, 229, 106, 0.6);
}

.tip-bottom {    
    color: #FFFFFF;
    background-color: rgba(255, 26, 139, 0.6);
}

.tip-mid {    
    color: #FFFFFF;
    background-color: rgba(116, 62, 226, 0.3);
}

</style>