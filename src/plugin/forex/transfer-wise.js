'use strict'

import { EventEmitter } from 'events'

class TransferWise extends EventEmitter {
    constructor() {
        super()

        let socket = null

        Object.assign(this, {
            connectWebsocket(market_code) {
                const self = this
                socket = new WebSocket('wss://three-forex.panicbot.xyz')
                
                console.log('Connect FX Websocket')
                // eslint-disable-next-line
                socket.onopen = function () {
                    socket.send(JSON.stringify({
                        request: 'SUBSCRIBE',
                        message: '',
                        channel: market_code
                    }))
                    console.log(`FX ${market_code} socket connected :)`)
                }
                socket.onmessage = function (event) {
                    const json = JSON.parse(event.data)
                    self.emit('fx_rate-' + market_code, {
                        key: market_code,
                        rate: json[market_code].rate,
                        time: new Date(json[market_code].time).getTime(),
                        time_human: new Date(json[market_code].time).toString()
                    })
                }
                socket.onclose = function (event) {
                    console.error('close event', event)
                    // @todo handled network close
                }

                socket.onerror = function (error) {
                    console.warn('error event', error)
                    // @todo handled network error
                }
            },
            closeSockets() {
                if (socket !== null) {
                    socket.close(1000, 'Panic bot app closing')
                    console.warn('closed fxrates socket')
                }

                socket = null
            }
        })
    }
}


export default TransferWise