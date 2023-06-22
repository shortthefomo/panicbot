<template>
    <div class="col-12">
        <div class="chart" ref="chart"></div>
    </div>
    <div class="col-12">
        <div class="btn-group" style="float:right;">
            <!-- eslint-disable-next-line -->
            <div class="me-2 my-5 mt-4" v-for="(option, index) in intervals">
                <input class="btn-check" v-on:change="handleChangeRange($event)" type="radio" name="options"
                    :id="'interval-' + option.value" :value="option.value" v-model="interval">
                <label class="btn btn-warning" :for="'interval-' + option.value">{{ option.label }}</label>
            </div>
            <button type="button" class="btn btn-purple me-2 my-5 mt-4"
                @click="handleChangeScale($event)">Scale</button>
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import { createChart, CrosshairMode, LineStyle, PriceLineSource } from 'lightweight-charts'
import decimal from 'decimal.js'

export default {
    name: "ChartLightWeight",
    props: ['bot', 'exchange_key'],
    data() {
        return {
            interval: 60,
            intervals: [],
            exchange: null,
            chart: null,
            candleSeries: null,
            volumeSeries: null,
            priceLine: null,
            rsiLine: null,
            trades: [],
            last_bar: {},
            current_bar: null,
            isLoading: true,
            ohlcCopy: null
        }
    },
    async mounted() {
        //this.loadChart()
        await this.setupChart()
        const self = this

        // // refrech data every min
        setInterval(async () => {
            console.log('refreshing chart data')
            await self.exchange.getOHCL(self.exchange_key.split('-')[1], self.interval)
            this.current_bar = null
        }, 60000)
    },
    methods: {
        // eslint-disable-next-line
        handleChangeScale(event) {
            this.chart.timeScale().fitContent()
        },
        // eslint-disable-next-line
        async handleChangeRange(event) {
            await this.setupChart()
        },
        async setupChart() {
            this.current_bar = null
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
            // const ohlc = this.$store.getters.getOHLCExchange(this.exchange_key, this.interval)
            // console.log('Fetched')
            if (this.chart == null) {
                this.chart = createChart(this.$refs.chart, {
                    width: this.$refs.chart.innerWidth,
                    height: 610,
                    crosshair: {
                        // Change mode from default 'magnet' to 'normal'.
                        // Allows the crosshair to move freely without snapping to datapoints
                        mode: CrosshairMode.Normal,

                        //Vertical crosshair line (showing Date in Label)
                        vertLine: {
                            width: 8,
                            color: '#C3BCDB44',
                            style: LineStyle.Solid,
                            labelBackgroundColor: '#9B7DFF',
                            visible: true,
                            labelVisible: true,
                        },

                        // Horizontal crosshair line (showing Price in Label)
                        horzLine: {
                            color: '#9B7DFF',
                            labelBackgroundColor: '#9B7DFF',
                            visible: true,
                            labelVisible: true,
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
                    axisLabelVisible: true,

                    priceFormat: {
                        type: 'price',
                        precision: 5,
                        minMove: 0.00001,
                    },
                    // title: 'test',
                    priceLineSource: PriceLineSource.LastVisible,
                    priceLineVisible: false,
                    // priceScaleId: 'right',
                    lastValueVisible: true
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

                const firstRow = document.createElement('div')
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
            this.loadChartData()
        },
        loadChartData() {
            this.ohlcCopy = this.$store.getters.getOHLCExchange(this.exchange_key, this.interval)
            const data = []
            for (let index = 0; index < this.ohlcCopy.length; index++) {
                const element = this.ohlcCopy[index]
                const d = {
                    time: this.adjustTime(element[0]),
                    open: new decimal(element[1]).toNumber(),
                    high: new decimal(element[2]).toNumber(),
                    low: new decimal(element[3]).toNumber(),
                    close: new decimal(element[4]).toNumber(),
                    value: new decimal(element[6]).toNumber(),
                }
                data.push(d)
                this.last_bar = d
            }

            // console.log('new last bar', this.last_bar)

            this.candleSeries.setData(data)
            this.chart.applyOptions({
                priceScale: {
                    position: 'right',
                    mode: 1,
                    autoScale: true,
                    invertScale: false,
                    // alignLabels: false,
                    borderVisible: false,
                    // borderColor: '#555ffd',
                },
            })
            this.volumeSeries.setData(data)
            if (this.priceLine != null) {
                this.candleSeries.removePriceLine(this.priceLine)
            }
            
            // this.candleSeries.update(this.last_bar)
            // this.volumeSeries.update(this.last_bar)

            this.priceLine = this.candleSeries.createPriceLine({
                price: this.last_bar.close,
                color: (this.last_bar.close >= this.last_bar.open) ? 'rgb(0, 229, 106)': 'rgb(255, 26, 139)',
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: true,
                title: this.last_bar.close,
            })
            // this.candleSeries.update(data)
            // this.volumeSeries.update(data)

            // if (this.rsiLine != null) {
            //     this.chart.removeSeries(this.rsiLine)
            // }


            // const rsiData = this.calculateRSI(data, 14)
            // this.rsiLine = this.chart.addLineSeries({
            //     lastValueVisible: false,
            //     priceLineVisible: false,
            //     priceScaleId: 'left',
            //     color: 'rgb(126, 87, 194)',
            //     lineWidth: 2,
            // })
            // this.rsiLine.setData(rsiData)

            if (this.isLoading) {
                //this.chart.timeScale().fitContent()
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
            const offset = (-1) * new Date(time * 1000).getTimezoneOffset() * 60000
            return Math.round(new Date((time * 1000) + offset).getTime() / 1000)
        },
        calculateRSI(data, count) {
            let rsi = function (data) {
                let gain = 0;
                let loss = 0;
                for (let i = 1; i < data.length; i++) {
                    let diff = data[i].close - data[i - 1].close;
                    if (diff < 0) {
                        loss += Math.abs(diff);
                    } else {
                        gain += diff;
                    }
                }
                return 100 - 100 / (1 + ((gain / data.length) / (loss / data.length)))
            };
            let result = []
            for (let i = count; i < data.length; i++) {
                let val = rsi(data.slice(i - count, i))
                result.push({ time: data[i].time, value: val })
            }
            return result
        }
    },
    computed: {
        historyExchange() {
            return this.$store.getters.getHistoryExchange(this.exchange_key)
        }
    },
    watch: {
        historyExchange(newValue) {
            if (this.last_bar == null) { return }
            this.ohlcCopy = this.$store.getters.getOHLCExchange(this.exchange_key, this.interval)
            const element = this.ohlcCopy[this.ohlcCopy.length-1]
            // console.log('element', element)
            
            const d = {
                time: element[0],
                open: new decimal(element[1]).toNumber(),
                high: new decimal(element[2]).toNumber(),
                low: new decimal(element[3]).toNumber(),
                close: new decimal(element[4]).toNumber(),
                value: new decimal(element[6]).toNumber(),
            }
            // console.log('element formatted', d)

            d.value +=  newValue[0].amount
            if (d.high < newValue[0].limit_price) {
                d.high = newValue[0].limit_price
            }
            if (d.low > newValue[0].limit_price) {
                d.low = newValue[0].limit_price
            }
            d.close = newValue[0].limit_price
            
            const live_bar = [
                d.time,
                d.open.toString(),
                d.high.toString(),
                d.low.toString(),
                d.close.toString(),
                0,
                d.value.toString(),
                0,
            ]

            this.ohlcCopy[this.ohlcCopy.length-1] = live_bar
            console.log('live_bar', this.ohlcCopy[this.ohlcCopy.length-1])
            const payload = {}
            payload.key = this.exchange_key
            payload.interval = this.interval
            payload.value = this.ohlcCopy
            this.$store.dispatch('updateOHLCExchange', payload)


            // const ohlc = this.$store.getters.getOHLCExchange(this.exchange_key, this.interval)
            // console.log('last_bar', this.last_bar)
            // if (this.current_bar == null) {
            //     this.current_bar = this.last_bar
            //     console.log('current_bar copy', this.current_bar)
            // }

            // this.trades.push(newValue[0].limit_price)
            // this.current_bar.value += newValue[0].amount

            // if (this.current_bar.high < newValue[0].limit_price) {
            //     this.current_bar.high = newValue[0].limit_price
            // }
            // if (this.current_bar.low > newValue[0].limit_price) {
            //     this.current_bar.low = newValue[0].limit_price
            // }
            
            // // console.log('last', this.ohlcCopy[this.ohlcCopy.length-1])
            // console.log('current_bar', this.current_bar)
            // const live_bar = [
            //     this.current_bar.time,
            //     this.current_bar.open.toString(),
            //     this.current_bar.high.toString(),
            //     this.current_bar.low.toString(),
            //     this.current_bar.close.toString(),
            //     0,
            //     this.current_bar.value,
            //     0,
            // ]
            // console.log('live_bar', live_bar)
            // this.ohlcCopy.push(live_bar)

            // const payload = {}
            // payload.key = this.exchange_key
            // payload.interval = this.interval
            // payload.value = this.ohlcCopy
            // this.$store.dispatch('updateOHLCExchange', payload)

            this.loadChartData()
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