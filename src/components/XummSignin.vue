<template>
	<div v-if="unlocked == false" :class="'signin position-absolute translate-middle top-50 start-50' + signinHide">
		<div class="p-5 m-4">
			<div class="container-fluid py-5">
				<div class="custom-border-outer"><img class="custom-border" :src="qrCode"></div>
				<h2 class="display-2 fw-bold">xumm signin</h2>
			</div>
		</div>
	</div>

	<div class="animation">
		
	</div>
	<div v-if="keySet == false" :class="'curtain' + curtainOpen">
		<!--v-on:click="unlock" -->
		<div class="container p-5">
			<div class="p-5 bg-light rounded-3">
				<div class="container-fluid p-5">
					<div v-if="unlocked == true" class="row">
						<h2 class="display-2 fw-bold">Exchange Access Tokens</h2>
						<div class="col-12">
							<h3>Bitstamp</h3>
							<div class="input-group mb-3">
								<label for="BITSTAMP_APIKEY" class="me-3 form-label">API KEY</label>
								<input type="text" :class="(VUE_APP_BITSTAMP_APIKEY == '') ? ' active form-control' + activeEdit:'form-control' + activeEdit" id="BITSTAMP_APIKEY" v-model="VUE_APP_BITSTAMP_APIKEY" placeholder="API KEY">
							</div>

							<div class="input-group mb-3">
								<label for="BITSTAMP_SECRETKEY" class="me-3 form-label">SECRET KEY</label>
								<input type="text" class="form-control active" id="BITSTAMP_SECRETKEY" v-model="VUE_APP_BITSTAMP_SECRETKEY" placeholder="SECRET KEY">
							</div>

							<div class="input-group mb-3">
								<label for="BITSTAMP_USER_ID" class="me-3 form-label">USER ID</label>
								<input type="text" :class="(VUE_APP_BITSTAMP_USER_ID == '') ? ' active form-control' + activeEdit:'form-control' + activeEdit" id="BITSTAMP_USER_ID" v-model="VUE_APP_BITSTAMP_USER_ID" placeholder="USER ID">
							</div>
						</div>
					</div>
					<div v-if="unlocked == true" class="row">
						<div class="col-12">
							<h3>Kraken</h3>
							<div class="input-group mb-3">
								<label for="KRAKEN_APIKEY" class="me-3 form-label">API KEY</label>
								<input type="text" :class="(VUE_APP_KRAKEN_APIKEY == '') ? ' active form-control' + activeEdit:'form-control' + activeEdit" id="KRAKEN_APIKEY" v-model="VUE_APP_KRAKEN_APIKEY" placeholder="API KEY">
							</div>

							<div class="input-group mb-3">
								<label for="KRAKEN_SECRETKEY" class="me-3 form-label">SECRET KEY</label>
								<input type="text" class="form-control active" id="KRAKEN_SECRETKEY" v-model="VUE_APP_KRAKEN_SECRETKEY" placeholder="SECRET KEY">
							</div>
						</div>
					</div>
					<div v-if="unlocked == true" class="row">
						<div class="col-12">
							<h3>Luno</h3>
							<div class="input-group mb-3">
								<label for="LUNO_APIKEY" class="me-3 form-label">API KEY</label>
								<input type="text" :class="(VUE_APP_LUNO_APIKEY == '') ? ' active form-control' + activeEdit:'form-control' + activeEdit" id="LUNO_APIKEY" v-model="VUE_APP_LUNO_APIKEY" placeholder="API KEY">
							</div>

							<div class="input-group mb-3">
								<label for="LUNO_SECRETKEY" class="me-3 form-label">SECRET KEY</label>
								<input type="text" class="form-control active" id="LUNO_SECRETKEY" v-model="VUE_APP_LUNO_SECRETKEY" placeholder="SECRET KEY">
							</div>
						</div>
					</div>
					<div v-if="unlocked == true" class="row">
						<div class="col-12">
							<h3>OrionX</h3>
							<div class="input-group mb-3">
								<label for="ORIONX_APIKEY" class="me-3 form-label">API KEY</label>
								<input type="text" :class="(VUE_APP_ORIONX_APIKEY == '') ? ' active form-control' + activeEdit:'form-control' + activeEdit" id="ORIONX_APIKEY" v-model="VUE_APP_ORIONX_APIKEY" placeholder="API KEY">
							</div>

							<div class="input-group mb-3">
								<label for="ORIONX_SECRETKEY" class="me-3 form-label">SECRET KEY</label>
								<input type="text" class="form-control active" id="ORIONX_SECRETKEY" v-model="VUE_APP_ORIONX_SECRETKEY" placeholder="SECRET KEY">
							</div>
						</div>
					</div>
					<!-- <button type="button" v-on:click="editStoreage" class="btn btn-warning me-5">unblur</button> -->
					<button type="button" v-on:click="setStoreage" class="btn btn-purple me-5">save</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
/* eslint-disable */
const { XummSdk } = require('xumm-sdk')
const Sdk = new XummSdk(process.env.VUE_APP_XUMMAPPKEY, process.env.VUE_APP_XUMMAPPSECRET)

export default {
	name: 'XummSignin',
	props: ['key_set'],
	emits: ['signin_complete'],
	data() {
		return {
			isLoading: true,
			qrCode: null,
			curtainOpen: '',
			signinHide: '',
			unlocked: false,
			keySet: false,
			activeEdit: false,
			VUE_APP_BITSTAMP_APIKEY: '',
			VUE_APP_BITSTAMP_SECRETKEY: '',
			VUE_APP_BITSTAMP_USER_ID: '',
			VUE_APP_KRAKEN_APIKEY: '',
			VUE_APP_KRAKEN_SECRETKEY: '',
			VUE_APP_LUNO_APIKEY: '',
			VUE_APP_LUNO_SECRETKEY: '',
			VUE_APP_ORIONX_APIKEY: '',
			VUE_APP_ORIONX_SECRETKEY: ''
		}
	},
	mounted() {
		console.log('XUMM userSignIn')
		this.userSignIn()
	},
	watch: {
		key_set(value) {
			console.log('keySet changed', value)
			this.keySet = value
		}
	},
	methods: {
		lock() {
			this.curtainOpen = ''
			this.signinHide = ''
			this.unlocked = false
			this.keySet = false
			this.isLoading = true
		},
		unlock() {
			this.curtainOpen = ' open'
			this.signinHide = ' hide'
			const self = this
			setTimeout(() => {
				self.unlocked = true
			}, 500)
		},
		editStoreage() {
			this.activeEdit = ' active'
		},
		async getStoreage() {
			const storageGet = await Sdk.storage.get()
			console.log('storageGet', storageGet)
			if (storageGet == null) { return }
			if ('keys' in storageGet) {
				this.VUE_APP_BITSTAMP_APIKEY = storageGet.keys.VUE_APP_BITSTAMP_APIKEY
				this.VUE_APP_BITSTAMP_SECRETKEY = storageGet.keys.VUE_APP_BITSTAMP_SECRETKEY
				this.VUE_APP_BITSTAMP_USER_ID = storageGet.keys.VUE_APP_BITSTAMP_USER_ID
				this.VUE_APP_KRAKEN_APIKEY = storageGet.keys.VUE_APP_KRAKEN_APIKEY
				this.VUE_APP_KRAKEN_SECRETKEY = storageGet.keys.VUE_APP_KRAKEN_SECRETKEY
				this.VUE_APP_LUNO_APIKEY = storageGet.keys.VUE_APP_LUNO_APIKEY
				this.VUE_APP_LUNO_SECRETKEY = storageGet.keys.VUE_APP_LUNO_SECRETKEY
				this.VUE_APP_ORIONX_APIKEY = storageGet.keys.VUE_APP_ORIONX_APIKEY
				this.VUE_APP_ORIONX_SECRETKEY = storageGet.keys.VUE_APP_ORIONX_SECRETKEY

				this.$store.dispatch('updateAccess', storageGet)
			}
			for (const property in storageGet.keys) {
				if (this.isLoading && storageGet.keys[property] != '') {
					this.signedIn()	
				}
			}
			this.isLoading = false
		},
		async setStoreage() {
			const payload = {
				keys: {
					VUE_APP_BITSTAMP_APIKEY: this.VUE_APP_BITSTAMP_APIKEY,
					VUE_APP_BITSTAMP_SECRETKEY: this.VUE_APP_BITSTAMP_SECRETKEY,
					VUE_APP_BITSTAMP_USER_ID: this.VUE_APP_BITSTAMP_USER_ID,
					VUE_APP_KRAKEN_APIKEY: this.VUE_APP_KRAKEN_APIKEY,
					VUE_APP_KRAKEN_SECRETKEY: this.VUE_APP_KRAKEN_SECRETKEY,
					VUE_APP_LUNO_APIKEY: this.VUE_APP_LUNO_APIKEY,
					VUE_APP_LUNO_SECRETKEY: this.VUE_APP_LUNO_SECRETKEY,
					VUE_APP_ORIONX_APIKEY: this.VUE_APP_ORIONX_APIKEY,
					VUE_APP_ORIONX_SECRETKEY: this.VUE_APP_ORIONX_SECRETKEY
				}
			}
			const storageSet = await Sdk.storage.set(payload)
			this.$store.dispatch('updateAccess', payload)
			console.log('storageSet', storageSet)
			this.signedIn()
		},
		signedIn() {
			this.keySet = true
			this.$emit('signin_complete', true)
		},
		async userSignIn() {
			try {
				const SignInPayload = {
					txjson: {
						TransactionType: 'SignIn'
					}
				}

				const payload = await Sdk.payload.createAndSubscribe(SignInPayload, event => {
					console.log('New sigin payload event:', event.data)

					if (event.data.signed === true) {
						console.log('Signin payload delivered')
						return event.data
					}

					if (event.data.signed === false) {
						console.log('Signin payload failed :(')
						return false
					}
				})
				this.subscriptionListener(payload)
				// console.log('payload', payload)
				console.log('payload', payload)
				this.qrCode = payload?.created?.refs?.qr_png
				return payload
			} catch (error) {
				console.log('error', error)
			}
			return {}
		},
		async subscriptionListener(subscription) {
			const self = this
			const resolveData = await subscription.resolved
			console.log('subscription', subscription)

			if (resolveData.signed === false) {
				console.log('The sign request was rejected :(')
			}

			if (resolveData.signed === true) {
				console.log('The sign request was signed :)')
				console.log('resolveData', resolveData)
				/**
				 * Let's fetch the full payload end result, and get the issued
				 * user token, we can use to send our next payload per Push notification
				 */
				const result = await Sdk.payload.get(resolveData.payload_uuidv4)
				this.$store.dispatch('setAddress', result.response.account)
				this.unlock()
				await this.getStoreage()
			}
		}
	}
}
</script>

<style>
/*
.curtain input {
	-webkit-filter: blur(2px);
	opacity:0.2;
}

.curtain input.active {
	-webkit-filter: blur(0);
	opacity:1;
}

.curtain  input:focus {
	-webkit-filter: blur(0);
  	opacity:1;
}
*/

.hide {
	opacity: 0;
	transition-duration: 0.2s;
}

.custom-border {
	padding: 10px;
	border: 10px transparent;
	box-shadow: -2px -4px 0px rgba(0, 0, 0, .75);
	width: 100%
}

.signin h2 {
	/* -webkit-text-stroke-width: 2px;
  	-webkit-text-stroke-color: black; */
	text-shadow: -2px -4px 0px rgba(0, 0, 0, .75);
}
.signin {
	color: #212529;
	z-index: 5;
}

[class*=curtain] {
	z-index: 4;
	position: relative;
	height: 100vh;
	width: 100%;
	margin: 0;
	padding: 0;
	top: 0;
	color: #212529;
}

[class*=curtain]::after,
[class*=curtain]::before {
	content: '';
	position: absolute;
	transition-duration: 0.5s;
	background-image: radial-gradient(#212529, #000000);
}

[class*=open]:after,
[class*=open]:before {
	opacity: 0;
}

.curtain::after,
.curtain::before {
	height: 100%;
	width: 50%;
}

.curtain::after {
	right: 0;
	top: 0;
	transform-origin: right;
}

.curtain::before {
	left: 0;
	transform-origin: left;
}

.open:after,
.open:before {
	transform: scaleX(0);
}
</style>