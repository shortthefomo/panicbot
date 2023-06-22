<template>
	<div class="row">
		<div class="col">
			<div class="p-5 mb-4 orange-background rounded-3">
				<div class="p-0 container-fluid py-0">
					<h2 class="btn-blue">XRPL Node</h2>
					<div class="row">
						<div class="col-12">
							<p v-if="'server' in server_info">pubkey_node: {{server_info.server.publicKey}}</p>
							<hr>
						</div>
						<div class="col-4">
							<p v-if="server_info != null">on line: {{server_info.online? 'true':'false'}}</p>
							<p v-if="'network_errors' in server_info">network errors: {{server_info.network_errors}}</p>
							<p v-if="'server' in server_info">build version: {{server_info.server.version}}</p>
							<p v-if="'server' in server_info">up time: {{server_info.server.uptime}}</p>
							<p v-if="'peers' in server_info">peers: {{server_info.peers}}</p>
							<p v-if="'server_state' in server_info">server state: {{server_info.server_state}}</p>
							<p v-if="'server' in server_info">uri: {{server_info.server.uri}}</p>
						</div>
						<div class="col-4">
							<p v-if="'fee' in server_info">fee: {{numeralFormat(server_info.fee.avg, '0,0')}}</p>
							<p v-if="'fee' in server_info">fee avg: {{numeralFormat(server_info.fee.last, '0,0')}}</p>
							<p v-if="'ledger' in server_info">ledger: {{numeralFormat(server_info.ledger.last, '0,0')}}</p>
							<p v-if="'ledger' in server_info">ledger count: {{numeralFormat(server_info.ledger.count, '0,0')}}</p>
							<p v-if="'latencyMs' in server_info">latency avg: {{numeralFormat(server_info.latencyMs.avg, '0,0[.]000')}}</p>
							<p v-if="'latencyMs' in server_info">latency last: {{numeralFormat(server_info.latencyMs.last, '0,0[.]000')}}</p>
							<p v-if="'latencyMs' in server_info">latency ago: {{numeralFormat(server_info.latencyMs.secAgo, '0,0[.]000')}}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'ServerInformation',
	props: ['server_info'],
	data() {
		return {
		}
	},
	mounted() {
	},
	methods: {
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
