<template>
    <div class="col-12">
        <div class="chart" ref="chart"></div>
    </div>
    <div class="col-12">
        <div class="btn-group" style="float:right;">
            <!-- eslint-disable-next-line -->
            <div class="me-2 my-5 mt-4" v-for="(option, index) in intervals" >
                <input class="btn-check" v-on:change="handleChangeRange($event)" type="radio" name="options" :id="'interval-'+option.value" :value="option.value" v-model="interval">
                <label class="btn btn-warning" :for="'interval-'+option.value">{{ option.label }}</label>
            </div>
            <button type="button" class="btn btn-purple me-2 my-5 mt-4" @click="handleChangeScale($event)">Scale</button>
        </div>
    </div>
</template>

<script>
    import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
    import decimal from 'decimal.js'

    export default {
        name: "ChartLightWeight",
        props: ['bot', 'exchange_key'],
        data() {
            return {
                interval : 60,
                intervals: [],
                exchange: null,
                chart: null,
                candleSeries: null,
                volumeSeries: null,
                trades: [],
                current_bar: {},
                isLoading: true
            }
        },
        // async updated() {
        //     if ((this.data.buy.length > 0 || this.data.sell.length > 0)&& this.last != this.data) {
        //         this.loadData()
        //     }
        // },
        async mounted() {
            //this.loadChart()
            this.getData()
            const self = this

            // refrech data every 5 min
            setInterval(() => {
                console.log('refreshing chart data')
                self.getData()
            }, 300000)
        },
        methods: {
            // eslint-disable-next-line
            handleChangeScale(event) {
                this.chart.timeScale().fitContent()
            },
            // eslint-disable-next-line
            handleChangeRange(event) {
                this.getData()
                this.chart.timeScale().fitContent()
            },
            async getData() {
                const exchanges = this.bot.getExchanges()
                for (let index = 0; index < exchanges.length; index++) {
                    const exchange = exchanges[index]
                    if (this.exchange_key == exchange.getKey()) {
                        this.exchange = exchange
                    }
                }
                this.intervals = this.exchange.getIntervals()
                if (this.isLoading) {
                    for (let index = 0; index < this.intervals.length; index++) {
                        const element = this.intervals[index]
                        if (element.label == '1 day') {
                            this.interval = this.intervals[index].value
                        }
                    }
                    
                }
                
                if (!this.exchange.hasChart()) { 
                    console.warn('this exchange has no chart data...')
                    return 
                }
                await this.exchange.getOHCL(this.exchange_key.split('-')[1], this.interval)
                const ohlc = this.$store.getters.getOHLCExchange(this.exchange_key, this.interval)
                // console.log('chart data', ohlc)
                if (this.chart == null) {
                    this.chart = createChart(this.$refs.chart, {
                        width: this.$refs.chart.innerWidth,
                        height: 610,
                        crosshair: {
                            // Change mode from default 'magnet' to 'normal'.
                            // Allows the crosshair to move freely without snapping to datapoints
                            mode: CrosshairMode.Normal,

                            // Vertical crosshair line (showing Date in Label)
                            vertLine: {
                                width: 8,
                                color: '#C3BCDB44',
                                style: LineStyle.Solid,
                                labelBackgroundColor: '#9B7DFF',
                            },

                            // Horizontal crosshair line (showing Price in Label)
                            horzLine: {
                                color: '#9B7DFF',
                                labelBackgroundColor: '#9B7DFF',
                            },
                        },
                        layout: {
                            backgroundColor: 'rgb(41, 41, 41)',
                            textColor: "#d1d4dc",
                        },
                        grid: {
                            vertLines: {
                                color: 'rgba(42, 46, 57, 1)',
                            },
                            horzLines: {
                                color: 'rgba(42, 46, 57, 1)',
                            },
                        },
                        timeScale: {
                            visible: true,
                            timeVisible: true,
                            secondsVisible: false,
                            lockVisibleTimeRangeOnResize: true,
                            rightBarStaysOnScroll: true,
                            barSpacing: 15,
                            rightOffset: 30
                        },
                        rightPriceScale: {
                            autoScale: true,
                            scaleMargins: {
                                top: 0.1,
                                bottom: 0.08,
                            }
                        }
                    })

                    // this.chart.priceScale('right').applyOptions({
                    //     visible: true,
                    //     autoScale: true,
                    //     scaleMargins: {
                    //         top: 0.96,
                    //         bottom: 0,
                    //     },
                    // })

                    this.candleSeries = this.chart.addCandlestickSeries()
                    this.candleSeries.applyOptions({
                        wickUpColor: 'rgb(0, 229, 106)',
                        upColor: 'rgb(0, 229, 106)',
                        wickDownColor: 'rgb(255, 26, 139)',
                        downColor: 'rgb(255, 26, 139)',
                        borderVisible: false,
                    })
                    this.volumeSeries = this.chart.addHistogramSeries({
                        color: 'rgba(255, 255, 255, 0.2)',
                        lineWidth: 2,
                        priceFormat: {
                            type: 'volume',
                        },
                        overlay: true,
                        scaleMargins: {
                            top: 0.8,
                            bottom: 0,
                        },
                    })

                    var firstRow = document.createElement('div')
                    firstRow.innerText = this.exchange_key.split('-')[0] + ' ' + this.exchange_key.split('-')[1]
                    firstRow.style.color = '#000000'
                    firstRow.style.float = 'left'
                    firstRow.classList.add('bg-warning')
                    firstRow.classList.add('px-2')
                    firstRow.classList.add('py-2')
                    
                    this.$refs.chart.prepend(firstRow)


                    const ro = new ResizeObserver((entries) => {
                        const cr = entries[0].contentRect
                        this.resize(cr.width, cr.height)
                    })

                    ro.observe(this.$refs.chart)

                    window.addEventListener("resize", () => {
                        this.resize(this.$refs.chart.innerWidth, this.$refs.chart.innerHeight);
                    })
                }
                
                
                const data = []
                for (let index = 0; index < ohlc.length; index++) {
                    const element = ohlc[index]
                    const d = {
                        time: this.adjustTime(element[0]),
                        open: new decimal(element[1]).toNumber(),
                        high: new decimal(element[2]).toNumber(),
                        low: new decimal(element[3]).toNumber(),
                        close: new decimal(element[4]).toNumber(),
                        value: new decimal(element[6]).toNumber(),
                    }
                    data.push(d)
                    this.currenct_bar = d
                    // break
                }
                
                this.candleSeries.setData(data)
                this.volumeSeries.setData(data)
                if (this.isLoading) {
                    this.chart.timeScale().fitContent()
                    this.isLoading = false
                }
            },
            // eslint-disable-next-line
            resize(width, height) {
                // stupid observer added x2... dunno why
                if (width == undefined) { return }
                this.chart.resize(width, 610)
            },
            adjustTime(time) {
                const offset = (-1) * new Date(time*1000).getTimezoneOffset() * 60000
                return Math.round(new Date((time *1000 )+ offset).getTime() / 1000)
            }
        },
        computed: {
            historyExchange() {
                return this.$store.getters.getHistoryExchange(this.exchange_key)
            }
        },
        watch: {
            historyExchange(newValue) {
                // console.log('newValue', newValue)
                this.trades = []
                let value = 0
                let high = 0
                let low = 0
                let close = 0
                let init = true

                for (const property in newValue) {
                    if (init) {
                        high = newValue[property].limit_price
                        low = newValue[property].limit_price
                        init = false
                    }
                    if (this.currenct_bar.time < new Date(newValue[property].timestamp).getTime()) {
                        this.trades.push(newValue[property].limit_price)
                        value += newValue[property].amount
                        if (high < newValue[property].limit_price) {
                            high = newValue[property].limit_price
                        }
                        if (low > newValue[property].limit_price) {
                            low = newValue[property].limit_price
                        }
                        close = newValue[property].limit_price
                    }
                }
                if (this.trades.length <= 1) { return }
                const data = {
                    time: this.currenct_bar.time,
                    open: new decimal(this.currenct_bar.open).toNumber(),
                    high: (high > this.currenct_bar.high) ? new decimal(high).toFixed(8):new decimal(this.currenct_bar.high).toNumber(),
                    low: (low < this.currenct_bar.low) ? new decimal(low).toFixed(8):new decimal(this.currenct_bar.low).toNumber(),
                    close: new decimal(close).toNumber(),
                    value: decimal.sum(this.currenct_bar.value, value).toNumber(),
                }
                // console.log('data updatesss', data)
                this.candleSeries.update(data)
                this.volumeSeries.update(data)
               
                // this.chart.timeScale().fitContent()
            }
        },
    }
</script>

<style scoped>

.chart {
	position: relative;
	width: 100%;
	height: 100%;
}
</style>