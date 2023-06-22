import { EventEmitter } from 'events'


class Bot extends EventEmitter {
    constructor() {
        super()

        let name = null
        let version = '0.0.1'
        let started = false
        let timstamp = null
        let market_code = null

        Object.assign(this, {
            async start() {
                console.log('starting panic bot')
                this.started = true
                this.timstamp = new Date().getTime()
                await this.inner_start()
            },
            async stop() {
                started = false
                timstamp = null
                await this.inner_stop()
            },
            async retstart() {
                await this.stop()
                await this.start()
            },
            setMarketCode(value) {
                market_code = value
            },
            getMarketCode() {
                return market_code
            },
            getTimeStamp() {
                return timstamp
            },
            setVersion(value) {
                version = value
            },
            getName() {
                return name
            },
            setName(value) {
                name = value
            },
            getStarted() {
                return started
            },
            getVersion() {
                return version
            }
        })
    }
}

export default Bot