import Pusher from 'pusher-js'

const pusher = new Pusher('ce386deb63691b2f671c', {
  cluster: 'us2',
  forceTLS: true,
  authEndpoint: 'https://realtime.orionx.com/auth'
})

export default pusher
