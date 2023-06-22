import Bot from '../bot.js'
import TransferWise from '../../forex/transfer-wise.js'

class PanicBot extends Bot {
    constructor($store) {
        super()
        this.setVersion('0.1.1')
        this.setName('panic-bot')
        let rate_set = false
        let exchanges = []
        
        const transfer_wise = new TransferWise()

        Object.assign(this, {

            listen() {
                const market_code = this.getMarketCode()
                if (market_code == null) { return }
                transfer_wise.addListener('fx_rate-' + market_code, (data) => {
                    // console.log('fx_rate-' + market_code, data.rate)
                    exchanges.forEach(exchange => {
                        exchange.setFxRate(data.rate)
                    })
                    $store.dispatch('updateFxRate',{ market_code, rate: data.rate })
                    rate_set = true
                })
            },
            async pause(milliseconds = 1000) {
                return new Promise(resolve =>  {
                    // console.log('pausing.... for new FX!')
                    setTimeout(resolve, milliseconds)
                })
            },
            async inner_start() {
                console.log('inner_start 1', this.getMarketCode())
                const market_code = this.getMarketCode()
                if (market_code == null) { return }
                console.log('inner_start 2')
                this.listen()
                transfer_wise.connectWebsocket(market_code)
                // wait for FX to be fetched
                while (await this.pause() && !rate_set) {
                    console.log('waiting... for FX')
                }

                for (const exchange of exchanges) {
                    console.log(`Bot starting exchange instance: ${exchange.getKey()}`)
                    await this.pause(200)
                    await exchange.start()
                }
            },
            async inner_stop() {
                transfer_wise.closeSockets()
                transfer_wise.removeAllListeners()
                rate_set = false
            
                exchanges.forEach(async exchange => {
                    await exchange.stop()
                })
            },
            addExchange(exchange) {
                exchanges.push(exchange)
            },
            getExchanges() {
                return exchanges
            }
        })
    }
}

export default PanicBot