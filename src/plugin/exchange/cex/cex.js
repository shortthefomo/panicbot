'use strict'

import Exchange from '../exchange.js'

class Cex extends Exchange {
    constructor($store) {
        super($store)

        let started = false
        this.connection = {
            private : {
                subscriptions: [],
                socket: null,
                open: false,
                open_time: null,
                close_time: null,
                uri: '',
                dirty: 0,
                reconnects: 0,
                errors: 0
            },
            public : {
                subscriptions: [],
                socket: null,
                open: false,
                open_time: null,
                close_time: null,
                uri: '',
                dirty: 0,
                reconnects: 0,
                errors: 0
            }
        }

        let restarting = false

        Object.assign(this, {
            async pause(milliseconds = 3000) {
                return new Promise(resolve =>  {
                    console.log('pausing.... ' + milliseconds)
                    setTimeout(resolve, milliseconds)
                })
            },
            openSockets() {
                const self = this
                $store.dispatch('start', this.getKey())
                if (this.connection.public.uri != '' && this.connection.public.open == false) {
                    console.log(`socket ${this.getName()} public openining`, this.connection.public.uri)
                    this.connection.public.socket = new WebSocket(this.connection.public.uri)
                    this.connection.public.open_time = new Date().getTime()
                    this.connection.public.open = true
                    this.connection.public.socket.onopen = function () {
                        for (let index = 0; index < self.connection.public.subscriptions.length; index++) {
                            const element = self.connection.public.subscriptions[index]
                            self.connection.public.socket.send(JSON.stringify(element))
                        }
                    }
                }
                if (this.connection.private.uri != '' && this.connection.private.open == false) {
                    console.log(`socket ${this.getName()} private openining`, this.connection.private.uri)
                    this.connection.private.socket = new WebSocket(this.connection.private.uri)
                    this.connection.private.open_time = new Date().getTime()
                    this.connection.private.open = true
                    this.connection.private.socket.onopen = function () {
                        for (let index = 0; index < self.connection.private.subscriptions.length; index++) {
                            const element = self.connection.private.subscriptions[index]
                            self.connection.private.socket.send(JSON.stringify(element))
                        }
                    }
                }
                this.listenSockets()
                started = true
            },
            closeSockets() {
                this.removeAllListeners()
                $store.dispatch('stop', this.getKey())

                if (this.connection.public.socket != null) { 
                    this.connection.public.socket.close(1000, 'Panic bot app closing')
                    this.connection.public.close_time = new Date().getTime()
                }
                if (this.connection.private.socket != null) { 
                    this.connection.private.socket.close(1000, 'Panic bot app closing')
                    this.connection.private.close_time = new Date().getTime()
                }
                this.connection.private.socket = null
                this.connection.public.socket = null
                this.connection.public.subscriptions = []
                this.connection.public.open == false
                this.connection.private.subscriptions = []
                this.connection.private.open == false

                console.warn(`closed ${this.getKey()} sockets`)
                started = false
            },
            listenSockets() {
                const self = this
                if (this.connection.private.socket != null) {
                    this.connection.private.socket.onclose = async function (close) {
                        self.connection.private.open = false
                        self.connection.private.close_time = new Date().getTime()
                        const network = self.getNetwork()
                        network.error_message = 'private stocket closed'
                        network.error = true
                        network.time_error = new Date().getTime()
                        self.setNetworkError(network)
                        $store.dispatch('updateConnection', { key: self.getKey(), value: false})
                        console.error(self.getKey() + ' close event', close)
                        self.connection.private.reconnects++

                        if (restarting) { return }
                        if (!close.wasClean) {
                            console.log(`websocket dirty disconnect ${self.getKey()}`)
                            self.connection.private.dirty++
                        }
                        self.restart()
                    }
                    this.connection.private.socket.onerror = async function (error) {
                        // ignore erros on reconnect
                        if (self.restarting) { return }
                        console.error(self.getKey() + ' private socket error', error)
                        self.connection.private.errors++
                        console.warn('socket error', error)
                        self.restart()
                    }
                }

                if (this.connection.public.socket != null) {
                    this.connection.public.socket.onclose = async function (close) {
                        self.connection.public.open = false
                        self.connection.public.close_time = new Date().getTime()
                        const network = self.getNetwork()
                        network.error_message = 'public stocket closed'
                        network.error = true
                        network.time_error = new Date().getTime()
                        self.setNetworkError(network)
                        $store.dispatch('updateConnection', { key: self.getKey(), value: false})

                        console.error(self.getKey() + ' close event', close)
                        self.connection.public.reconnects++

                        if (restarting) { return }
                        if (!close.wasClean) {
                            console.log(`websocket dirty disconnect ${self.getKey()}`)
                            self.connection.public.dirty++
                        }
                        self.restart()
                    }
                    this.connection.public.socket.onerror = async function (error) {
                        // ignore erros on reconnect
                        if (restarting) { return }
                        console.error(self.getKey() + ' public socket error', error)
                        self.connection.public.errors++
                        console.warn('socket error', error)
                        self.restart()
                    }
                }
            },
            getPublicSocket() {
                return this.connection.public.socket
            },
            getPrivateSocket() {
                return this.connection.private.socket
            },
            getStarted() {
                return started
            },
            async start() {
                console.log(`Starting instance: ${this.getName()}`)
                if (this.ready == false) {
                    throw new Error(`${this.getKey()} is not ready to start for ${this.getName()}`)
                }
                await this.init()
            },
            async stop() {
                this.closeSockets()
            },
            async restart() {
                await this.stop()
                if (this.restarting) { return }
                this.restarting = true
                if ((this.connection.private.reconnects + this.connection.public.reconnects) > 15) {
                    console.log(this.getKey() + ' stopped trying reconnect')
                    return
                }

                if ((this.connection.private.reconnects + this.connection.public.reconnects) > 10) {
                    console.log(this.getKey() + ' long pause 20 minutes')
                    await this.pause(1200000)
                } 
                else if ((this.connection.private.reconnects + this.connection.public.reconnects) > 5) {
                    console.log(this.getKey() + ' medium pause 2 minutes')
                    await this.pause(120000)
                }
                else {
                    console.log(this.getKey() + ' short pause 5 seconds')
                    await this.pause(5000)
                }
                this.restarting = false

                await this.start()
            }
        })
    }
}


//todo handle errors

// opde 429 - too many requests ~ kraken will throw this.
export default Cex