<template>
	<div v-if="complete == false" class="row">
		<div class="col">
			<div class="p-5 mb-4 orange-background rounded-3">
				<div class="p-0 container-fluid py-0">
					<h2>Flow Selection</h2>
					<div class="input-group">
						<span class="input-group-text">Payment Flow</span>
				
						<select v-model="flow" v-on:change="handleChangeFlow($event)">
							<option v-for="(option, index) in flows" :value="option.value" :key="index">
								{{ option.label }}
							</option>
						</select>
					</div>
					<div v-if="flow == 'ODL'" class="odl">
						<div class="input-group">
							<span class="input-group-text">Exchange A</span>
					
							<select v-model="exchanges['a'].exchange" v-on:change="handleChangeExchange($event, 'a')">
								<option v-for="(option, index) in available_exchanges" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
							<span v-if="exchanges['a'].fiat.length > 0" class="input-group-text ms-5">Currency A</span>
							<select v-if="exchanges['a'].fiat.length > 0" v-model="exchanges['a'].currency" v-on:change="handleChangeCurrency($event, 'a')">
								<option v-for="(option, index) in exchanges['a'].fiat" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
						</div>
						<div>
							<!-- eslint-disable-next-line -->
							<p v-for="route in exchanges['a'].routes"> {{ route.route }}</p>
						</div>
						<div class="input-group">
							<span class="input-group-text">Exchange B</span>
					
							<select v-model="exchanges['b'].exchange" v-on:change="handleChangeExchange($event, 'b')">
								<option v-for="(option, index) in available_exchanges" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
							<span v-if="exchanges['b'].fiat.length > 0" class="input-group-text ms-5">Currency B</span>
							<select v-if="exchanges['b'].fiat.length > 0" v-model="exchanges['b'].currency" v-on:change="handleChangeCurrency($event, 'b')">
								<option v-for="(option, index) in exchanges['b'].fiat" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
						</div>
						<div>
							<!-- eslint-disable-next-line -->
							<p v-for="route in exchanges['b'].routes"> {{ route.route }}</p>
						</div>
						<button v-if="exchanges['a'].routes.length > 0 && exchanges['b'].routes.length > 0 && bot_status == 'stopped'" type="button" class="btn btn-purple me-2" @click="loadExchanges()">Start</button>
					</div>
					<div v-if="flow == 'Trade'" class="trade">
						<div class="input-group">
							<span class="input-group-text">Exchange</span>
					
							<select v-model="exchanges['a'].exchange" v-on:change="handleChangeExchange($event, 'a')">
								<option v-for="(option, index) in available_exchanges" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
							<span v-if="exchanges['a'].fiat.length > 0" class="input-group-text ms-5">Currency</span>
							<select v-if="exchanges['a'].fiat.length > 0" v-model="exchanges['a'].currency" v-on:change="handleChangeCurrency($event, 'a')">
								<option v-for="(option, index) in exchanges['a'].fiat" :value="option.value" :key="index">
									{{ option.label }}
								</option>
							</select>
						</div>
					</div>
					<div v-if="flow == 'Best'" class="best">
						<!-- eslint-disable-next-line -->
						<div v-for="(option, index) in available_fiat" class="form-check form-check-inline">
							<input class="form-check-input" type="checkbox" :id="index + '-fiat'" :value="option.value" v-model="checkedFiat">
							<label class="form-check-label" :for="option.value">{{ option.label }}</label>
						</div>
						<br/>
						<button v-if="available_fiat.length > 0 && checkedFiat.length > 0" type="button" class="btn btn-purple me-2" @click="loadBest()">Start</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	/* eslint-disable */
import Kraken from '../plugin/exchange/cex/kraken.js'
import Bitstamp from '../plugin/exchange/cex/bitstamp.js'
import Luno from '../plugin/exchange/cex/luno.js'
import Orionx from '../plugin/exchange/cex/orionx.js'

export default {
	name: 'InterfaceSelection',
	props: ['load_routes', 'bot', 'bot_status'],
	data() {     
		return {
			complete: false,
			exchanges: {
				a: {
					instance: null,
					exchange: null,
					currency: null,
					fiat: [],
					market_data: null,
					routes: []
				},
				b: {
					instance: null,
					exchange: null,
					currency: null,
					fiat: [],
					market_data: null,
					routes: []
				}
			},
			available_fiat: [],
			selected_fiat: null,
			checkedFiat: [],
			flow: 'none',
			flows: [
				{ label: 'ODL', value: 'ODL' },
				{ label: 'Trade', value: 'Trade' },
				{ label: 'Best Rate', value: 'Best' }
			],
			available_exchanges: [
				{ label: 'Kraken', value: 'kraken' },
				{ label: 'Bitstamp', value: 'bitstamp' },
				{ label: 'Luno', value: 'luno' },
				{ label: 'OrionX', value: 'orionx' }
			]
		}
	},
	mounted() {
		this.getAllFiat()
	},
	methods: {
		async loadBest() {
			console.log('Start')
			this.bot.setMarketCode('USD' + (this.checkedFiat[0] == 'all' ? 'EUR': this.checkedFiat))
			
			const keys = []
			
			let first = true
			if (this.checkedFiat[0] == 'all') {
				for (let index = 0; index < this.available_fiat.length; index++) {
					const fiat = this.available_fiat[index]
					if (fiat.value != 'all') {
						for (const property in this.available_fiat[index]['exchanges']) {
							const exchange = this.instanceExchange(property)
							const market_data = await exchange.getMarketsData()
							

							const payload = {
								name: property,
								key: property + '-XRP' + fiat.value,
								base: 'XRP',
								quote: fiat.value,
								market_data: market_data['XRP' + fiat.value],
								leg: 'a'
							}
							console.log('payload', payload)
							
							if (first) {
								payload.master = property + '-XRP' + fiat.value
								payload.side = 'a'
								first = false
							}
					
							console.log('a', 'init', payload.key)
							this.$store.dispatch('init', payload)
							exchange.setMarketPair(fiat.value, 'XRP')

							keys.push(payload)
							this.bot.addExchange(exchange)
						}
					}
				}
			}
			else {
				this.checkedFiat.forEach(async element => {
					for (let index = 0; index < this.available_fiat.length; index++) {
						const fiat = this.available_fiat[index]
						if (element == fiat.value) {
							for (const property in this.available_fiat[index]['exchanges']) {
								const exchange = this.instanceExchange(property)
								const market_data = await exchange.getMarketsData()
								

								const payload = {
									name: property,
									key: property + '-XRP' + element,
									base: 'XRP',
									quote: element,
									market_data: market_data['XRP' + element],
									leg: 'a'
								}
								console.log('payload', payload)
								
								if (first) {
									payload.master = property + '-XRP' + element
									payload.side = 'a'
									first = false
								}
						
								console.log('a', 'init', payload.key)
								this.$store.dispatch('init', payload)
								exchange.setMarketPair(element, 'XRP')

								keys.push(payload)
								this.bot.addExchange(exchange)
							}
						}
					}	
				})
			}
			
			
			const legs = {
				'a': this.exchanges['a'].routes
			}
			this.$emit('load_routes', keys, { 'a': []})
			this.complete = true
		},
		loadExchanges() {
			console.log('Start')
			this.bot.setMarketCode(this.exchanges['a'].currency + this.exchanges['b'].currency)
			
			const keys = []
			let first = true
			this.exchanges['a'].routes.forEach(element => {
				for (const property in element) {
					if (property.includes('h')) {
						const payload = {
							name: this.exchanges['a'].exchange,
							key: this.exchanges['a'].exchange + '-' + element[property].key,
							base: element[property].base,
							quote: element[property].quote,
							market_data: this.exchanges['a']['market_data'][element[property].base + element[property].quote],
							leg: 'a'
						}
						console.log('element', element)
						console.log('payload', payload)
						if (first) {
							payload.master = this.exchanges['a'].exchange + '-' + element[property].key
							payload.side = 'a'
							first = false
						}
						// if (payload.key == 'bitstamp-XRPUSD') {
							console.log('a', 'init', payload.key)
							this.$store.dispatch('init', payload)
							const exchange = this.instanceExchange(this.exchanges['a']['exchange'])
							exchange.setMarketPair(element[property].quote, element[property].base)
							keys.push(payload)
							this.bot.addExchange(exchange)
						// }
					}
				}
			})

			first = true
			this.exchanges['b'].routes.forEach(element => {
				for (const property in element) {
					if (property.includes('h')) {
						const payload = {
							name: this.exchanges['b'].exchange,
							key: this.exchanges['b'].exchange + '-' + element[property].key,
							base: element[property].base,
							quote: element[property].quote,
							market_data: this.exchanges['b']['market_data'][element[property].base + element[property].quote],
							leg: 'b'
						}
						console.log('payload', payload)
						if (first) {
							payload.master = this.exchanges['b'].exchange + '-' + element[property].key
							payload.side = 'b'
							first = false
						}
						// if (payload.key == 'luno-XBTZAR') {
							console.log('b', 'init', payload.key)
							this.$store.dispatch('init', payload)
							const exchange = this.instanceExchange(this.exchanges['b']['exchange'])
							exchange.setMarketPair(element[property].quote, element[property].base)
							keys.push(payload)
							this.bot.addExchange(exchange)
						// }
					}
				}
			})

			const legs = {
				'a': this.exchanges['a'].routes,
				'b': this.exchanges['b'].routes
			}
			this.$emit('load_routes', keys, legs)
			// clear instances we used for route calcs.
			this.exchanges = {
				a: {
					instance: null,
					exchange: null,
					currency: null,
					fiat: [],
					market_data: null,
					routes: []
				},
				b: {
					instance: null,
					exchange: null,
					currency: null,
					fiat: [],
					market_data: null,
					routes: []
				}
			}
			this.complete = true
		},
		instanceExchange(key) {
			switch (key) {
				case 'kraken':
					return new Kraken(this.$store)
					break
				case 'bitstamp': 
					return new Bitstamp(this.$store)
					break
				case 'luno': 
					return new Luno(this.$store)
					break
				case 'orionx':
					return new Orionx(this.$store)
					break
			}
			
			return null
		},
		async handleChangeExchange(event, key) {
			const exchange = this.instanceExchange(event.target.value)
			const market_data = await exchange.getMarketsData()
			const fiat = []
			const fiat_pairs = exchange.getFiatPairs()
			for (const property in fiat_pairs) {
				fiat.push({ label: fiat_pairs[property], value: fiat_pairs[property]})
			}

			this.exchanges[key]['instance'] = exchange
			this.exchanges[key]['market_data'] = market_data
			this.exchanges[key]['fiat'] = fiat
		},
		async handleChangeCurrency(event, key) {
			console.log('event.target.value', event.target.value)
			console.log('key', key)

			this.exchanges[key]['routes'] = this.buildRoutes(event.target.value, this.exchanges[key], key)
		},
		async handleChangeFlow(event) {
			console.log('handleChangeFlow', event.target.value)
		},
		async handleChangeBest(event) {
			console.log('handleChangeBest', event.target.value)
			console.log('handleChangeBest', event.target.selectedIndex)
			console.log('handleChangeBest', this.available_fiat[event.target.selectedIndex])
			this.selected_fiat = this.available_fiat[event.target.selectedIndex]
		},
		async getAllFiat() {
			const fiat = [{ label: 'All', value: 'all'}]
			const keys = ['kraken', 'bitstamp', 'luno', 'orionx']
			const all_pairs = {}
			for (let index = 0; index < keys.length; index++) {
				const element = keys[index]
				const exchange = this.instanceExchange(element)
				await exchange.getMarketsData()
				const fiat_pairs = exchange.getFiatPairsBaseXRP()
				for (const property in fiat_pairs) {
					if (!(property in all_pairs)) {
						all_pairs[property] = {}
					}

					all_pairs[property]['key'] = fiat_pairs[property]
					if (!('exchanges' in all_pairs[property])) {
						all_pairs[property]['exchanges'] = {}
					}
					
					all_pairs[property]['exchanges'][element] = element
				}
			}

			for (const property in all_pairs) {
				fiat.push({ label: all_pairs[property].key, value: all_pairs[property].key, exchanges: all_pairs[property].exchanges })
			}

			console.log('fiat', fiat)
			this.available_fiat = fiat
		},
		invertLegs(legs) {
			const newLegs = []
			for (let index = 0; index < legs.length; index++) {
				const leg = legs[index]
				const newLeg = {}
				newLeg.route = leg.route.split('->').reverse().join('->')
				if ('h2' in leg) {
					newLeg.h1 = {
						key: leg.h2.key,
						base: leg.h2.base,
						quote: leg.h2.quote
					}
					newLeg.h2 = {
						key: leg.h1.key,
						base: leg.h1.base,
						quote: leg.h1.quote
					}
				}
				else {
					newLeg.h1 = {
						key: leg.h1.key,
						base: leg.h1.base,
						quote: leg.h1.quote
					}
				}
				newLegs.push(newLeg)
			}
			return newLegs
		},
		buildRoutes(currency, exchange, invert) {
			// XRP/AED
			// base/quote
			const data = exchange.market_data
			const fiat = exchange.fiat

			// console.log('currency', currency)
			// console.log('exchange', exchange)
			// console.log('data', data)
			// console.log('fiat2', fiat)

			let markets = {}
			for (const property in data) {
				if (data[property].base == 'XRP') {
					markets[property] = {
						base: data[property].base,
						quote: data[property].quote
					}
				}
			}
			console.log('markets', markets)

			const fiatMarket = {}
			const fiat_pairs = exchange['instance'].getFiatPairs()
			for (const property in markets) {
				if (markets[property].quote in fiat_pairs) {
					fiatMarket[property] = markets[property]
				}
			}
			console.log('fiatMarket', fiatMarket)


			const baseMarket = {}
			for (const property in markets) {
				if (!(markets[property].quote in fiat)) {
					baseMarket[property] = markets[property]
				}
			}
			console.log('baseMarket', baseMarket)

			const quoteMarket = {}
			for (const property in data) {
				if (data[property].quote == currency) {
					quoteMarket[property] = data[property]
				}
			}
			console.log('quoteMarket', quoteMarket)

			const routes = {}
			for (const fiat in fiatMarket) {
				if (currency == fiatMarket[fiat].quote) {
					const route = fiatMarket[fiat].quote +'->'+ fiatMarket[fiat].base
					routes[route] = {
						h1: { key: fiat, quote: fiatMarket[fiat].quote, base: fiatMarket[fiat].base },
						route: route
					}
				}
			}
			for (const quote in quoteMarket) {
				for (const base in baseMarket) {
					if (quoteMarket[quote].base == baseMarket[base].quote) {
						const route = quoteMarket[quote].quote + '->' + quoteMarket[quote].base  + '->' + baseMarket[base].base
						routes[route] = {
							h1: { key: quote, quote: quoteMarket[quote].quote, base: quoteMarket[quote].base },
							h2: { key: base, quote: baseMarket[base].quote, base: baseMarket[base].base },
							route: route
						}
					}
				}
			}
			for (const fiat in fiatMarket) {
				const quote1 = fiatMarket[fiat].quote + currency
				if (quote1 in data) {
					const route = currency + '->' + fiatMarket[fiat].quote  + '->' + fiatMarket[fiat].base
					routes[route] = {
						h1: { key: quote1, quote: currency, base: fiatMarket[fiat].quote },
						h2: { key: fiat, quote: fiatMarket[fiat].quote, base: fiatMarket[fiat].base },
						route: route
					}
				}

				const quote2 = currency + fiatMarket[fiat].quote
				if (quote2 in data) {
					const route = currency + '->' + fiatMarket[fiat].quote  + '->' + fiatMarket[fiat].base
					routes[route] = {
						h1: { key: quote2, quote: fiatMarket[fiat].quote, base: currency },
						h2: { key: fiat, quote: fiatMarket[fiat].quote, base: fiatMarket[fiat].base },
						route: route
					}
				}
			}
			console.log('routes', routes)

			const list = []
			for (const route in routes) {
				list.push(routes[route])
			}

			if (invert == 'a') {
				return this.invertLegs(list)
			}
			return list
		}
	}
}
</script>


<style scoped>
.bg-light {
	color: #000000;
}

.orange-background {
	color: #FFFFFF;
	background-color: #ff931a;
}
</style>
