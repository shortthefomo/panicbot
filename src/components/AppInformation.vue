<template>
	<div class="row">
		<div class="col">
			<div class="p-5 mb-4 orange-background rounded-3">
				<div class="p-0 container-fluid py-0">
					<h2 class="btn-purple">Panicbot App</h2>
					<div class="row" v-if="routes.length > 0">
						<!-- eslint-disable-next-line -->
						<div class="col-4" v-for="route in routes">
							<p>{{route.key}} : <span class="glyphicon" :class="checkNetwork(isExchangeConnected(route.key))"></span></p>
						</div>
					</div>
					<hr />
					<p>memory: {{memory}} mb</p>
					<p>time: {{time}}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'AppInformation',
	props: ['routes'],
	data() {
		return {
			memory: 0,
			time: 0,
			exchanges: [],
			isLoading: true,
		}
	},
	mounted() {
		this.checkAppMemoryHealth()
	},
	computed: {

	},
	methods: {
		isExchangeConnected(key) {
			return this.$store.getters.getConnected(key)
		},
		checkAppMemoryHealth() {
			if (!this.isLoading) { return }
			const self = this
			const used = performance.memory.usedJSHeapSize / 1024 / 1024
			const mb = Math.round(used * 100) / 100
			const time = new Date().toISOString()
			this.memory = mb
			this.time = time
			// this.exchanges = []
			// for (let index = 0; index < this.routes.length; index++) {
			// 	const element = this.routes[index]
			// 	this.exchanges.push({
			// 		connection: this.$store.getters.getConnected(element.key),
			// 		name: element.key
			// 	})
			// }

			const lastCheck = setTimeout(() => {
				clearTimeout(lastCheck)
				self.checkAppMemoryHealth()
			}, 3000)
			this.isLoading = true
		},
		checkNetwork(network) {
			if (network) {
				return 'one-fine-green-dot'
			} else {
				return 'one-fine-red-dot'
			}
		}
	}
}
</script>


<style scoped>

.shadows {
	text-shadow: -2px -4px 0px rgba(0, 0, 0, .75);
	opacity: 0.3;
}
.bg-light {
	color: #000000;
}

.orange-background {
	color: #FFFFFF;
	/* background-color: #ff931a; */
}
</style>
