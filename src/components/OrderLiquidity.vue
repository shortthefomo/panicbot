
<template>
    <div class="p-0 mb-4 dark-background rounded-3">
        <div class="row">
            <div class="col">
                <div class="p-2 mb-4 container-fluid">
                    <svg height="75%" width="75%" :viewBox="viewBox" id="svg" style="margin-left: auto;margin-right: auto;display: block;">
                        <defs>
                            <linearGradient x1="50%" y1="100%" x2="50%" y2="0%" id="cap-gradient-ab">
                                <stop stop-color="#FF1A8B" stop-opacity="0.1" offset="0%"></stop>
                                <stop stop-color="#FF1A8B" stop-opacity="0.5" offset="100%"></stop>
                            </linearGradient>
                            <clipPath id="cap-gradient-ab-clip">
                                <circle cx="100" cy="100" r="100"></circle>
                            </clipPath>
                        </defs>
                        <g>
                            <circle cx="100" cy="100" r="100" fill="#FFFFFF" opacity="0.01" class="css-8n5w38"></circle>
                            <circle cx="100" cy="100" r="96" fill="transparent" stroke="#FF1A8B" stroke-width="1" class="css-8n5w38"></circle>
                        </g>
                        <g clip-path="url(#cap-gradient-ab-clip)">
                            <line class="liquidity-float liquidity-float-danger" x1="0" :y1="ab.sum" :x2="size" :y2="ab.sum" stroke-width="1"></line>
                            <g transform="translate(0,0)">
                                <path :d="ab.path" fill="url(#cap-gradient-ab)" />
                            </g>
                        </g>
                    </svg>
                    {{size - ((1/(max_ask_liquidity / ask_liquidity)) * size) }}
                </div>
            </div>
            <div class="col">
                <div class="p-2 mb-4 container-fluid">
                    <svg height="75%" width="75%" :viewBox="viewBox" id="svg" style="margin-left: auto;margin-right: auto;display: block;">
                        <defs>
                            <linearGradient x1="50%" y1="100%" x2="50%" y2="0%" id="cap-gradient-bb">
                                <stop stop-color="#00e56a" stop-opacity="0.1" offset="0%"></stop>
                                <stop stop-color="#00e56a" stop-opacity="0.5" offset="100%"></stop>
                            </linearGradient>
                            <clipPath id="cap-gradient-bb-clip">
                                <circle cx="100" cy="100" r="100"></circle>
                            </clipPath>
                        </defs>
                        <g>
                            <circle cx="100" cy="100" r="100" fill="#FFFFFF" opacity="0.01" class="css-8n5w38"></circle>
                            <circle cx="100" cy="100" r="96" fill="transparent" stroke="#00e56a" stroke-width="1" class="css-8n5w38"></circle>
                        </g>
                        <g clip-path="url(#cap-gradient-bb-clip)">
                            <line class="liquidity-float liquidity-float-success" x1="0" :y1="bb.sum" :x2="size" :y2="bb.sum" stroke-width="1"></line>
                            <g transform="translate(0,0)">
                                <path :d="bb.path" fill="url(#cap-gradient-bb)" />
                            </g>
                        </g>
                    </svg>
                    {{size - ((1/(max_bid_liquidity / bid_liquidity)) * size) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */
    import _, {debounce} from 'lodash'

    export default {
        name: "OrderLiquidity",
        props: ['book', 'convert'],
        data() {
            return {
                asks: [],
                bids: [],
                lastupdate: new Date().getTime(),
                isLoading: true,
                ask_liquidity: 0,
                bid_liquidity: 0,
                max_bid_liquidity: 100,
                max_ask_liquidity: 100,

                ask_graph: [],
                bid_graph: [],

                size: 200,
                viewBox: "0 0 200 200",
                bb: {
                    sum: 0,
                    path: 'M10 10'
                },
                ab: {
                    sum: 0,
                    path: 'M10 10'
                },
                interval: null
            }
        },
        created() {
            this.debounced = debounce(data => {
                this.asks = [...data.asks]
                this.bids = [...data.bids]
                this.calculateLiquidity()
                this.skipCount = 0
            }, 50)
        },
        watch: {
            book(newValue) {
                this.skipCount++
                if (this.skipCount > 20) {
                    this.asks = [...newValue.asks]
                    this.bids = [...newValue.bids]
                    this.calculateLiquidity()
                    this.skipCount = 0
                }
                else {
                    this.debounced(newValue)
                }
            }
        },
        beforeUnmount() {
            this.debounced.cancel()
        },
        mounted() {
            this.isLoading = false
        },
        methods: {
            calculateLiquidity() {
                this.max_bid_liquidity = this.max_bid_liquidity -0.01
                this.max_ask_liquidity = this.max_ask_liquidity -0.01
                this.ask_liquidity = 0
                while (this.asks.length>0) {
                    const ask = this.asks.pop()
                    // this.ask_liquidity +=  (this.convert) ? ask.limit_price_converted * ask.amount : ask.limit_price * ask.amount
                    this.ask_liquidity += ask.limit_price * ask.amount
                }
                if ( this.ask_liquidity > this.max_ask_liquidity ) {
                    this.max_ask_liquidity = this.ask_liquidity
                }
                this.ask_graph.unshift( this.size - ((1/(this.max_ask_liquidity / this.ask_liquidity)) * this.size) )
                while (this.ask_graph.length>50) {
                    this.ask_graph.pop()
                }
                this.ask_graph.unshift(0)
                this.ask_graph.push(0)
                this.asks_draw()

                this.bid_liquidity = 0
                while (this.bids.length>0) {
                    const bid = this.bids.pop()
                    // this.bid_liquidity += (this.convert) ? bid.limit_price_converted * bid.amount : bid.limit_price * bid.amount
                    this.bid_liquidity += bid.limit_price * bid.amount
                }
                if ( this.bid_liquidity > this.max_bid_liquidity ) {
                    this.max_bid_liquidity = this.bid_liquidity
                }
                this.bid_graph.unshift( this.size - ((1/(this.max_bid_liquidity / this.bid_liquidity)) * this.size) )
                while (this.bid_graph.length>50) {
                    this.bid_graph.pop()
                }
                this.bid_graph.unshift(0)
                this.bid_graph.push(0)
                this.bids_draw()
            },
            asks_draw() {
                let sum = 0
                let points = []
                for (var i = 0; i < this.ask_graph.length; i++) {
                    const point = {x: i * 5, y: 200 - this.ask_graph[i] }
                    points.push(point)
                    sum += point.y
                }

                sum = (sum>0) ? sum / ((this.ask_graph.length-1)/2) : 0
                this.ab.sum = sum - 200
                this.ab.path = this.makePath(points)
            },
            bids_draw() {
                let sum = 0
                let points = []
                for (var i = 0; i < this.bid_graph.length; i++) {
                    const point = {x: i * 5, y: this.bid_graph[i] }
                    points.push(point)
                    sum += point.y
                }
                sum = (sum>0) ? sum / ((this.bid_graph.length-1)/2) : 0
                this.bb.sum = sum
                this.bb.path = this.makePath(points)
            },
            catmullRom2bezier(points) {
                let result = []
                for (var i = 0; i < points.length - 1; i++) {
                    var p = []

                    p.push({
                        x: points[Math.max(i - 1, 0)].x,
                        y: points[Math.max(i - 1, 0)].y 
                    })
                    p.push({
                        x: points[i].x,
                        y: points[i].y
                    })
                    p.push({
                        x: points[i + 1].x,
                        y: points[i + 1].y
                    })
                    p.push({
                        x: points[Math.min(i + 2, points.length - 1)].x,
                        y: points[Math.min(i + 2, points.length - 1)].y
                    })

                    // Catmull-Rom to Cubic Bezier conversion matrix
                    //    0       1       0       0
                    //  -1/6      1      1/6      0
                    //    0      1/6      1     -1/6
                    //    0       0       1       0

                    var bp = []
                    bp.push({
                        x: ((-p[0].x + 6 * p[1].x + p[2].x) / 6),
                        y: ((-p[0].y + 6 * p[1].y + p[2].y) / 6)
                    })
                    bp.push({
                        x: ((p[1].x + 6 * p[2].x - p[3].x) / 6),
                        y: ((p[1].y + 6 * p[2].y - p[3].y) / 6)
                    })
                    bp.push({
                        x: p[2].x,
                        y: p[2].y
                    })
                    result.push(bp)
                }

                return result
            },
            makePath(points) {
                let result = "M" + points[0].x + "," + points[0].y + " "
                let catmull = this.catmullRom2bezier(points)
                for (let i = 0; i < catmull.length; i++) {
                    result += "C" + catmull[i][0].x + "," + catmull[i][0].y + " " + catmull[i][1].x + "," + catmull[i][1].y + " " + catmull[i][2].x + "," + catmull[i][2].y + " "
                }
                return result
            }
        }
    }
</script>

<style scoped>
.liquidity-float {
	stroke: #FFFFFF; 
	stroke-dasharray: 2px;
}

.liquidity-float-danger {
	stroke: #FF1A8B; 
	stroke-dasharray: 2px;
}

.liquidity-float-success {
	stroke: #00e56a; 
	stroke-dasharray: 2px;
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

</style>