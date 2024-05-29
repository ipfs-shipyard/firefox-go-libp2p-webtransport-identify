import { multiaddr } from '@multiformats/multiaddr'
import { createLibp2p } from 'libp2p'
import { webTransport } from '@libp2p/webtransport'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'

// Update this variable with the output from relay.js
const ma = 'REPLACE ME WITH THE OUTPUT FROM go-libp2p.js'

const node = await createLibp2p({
  transports: [
    webTransport()
  ],
  services: {
    identify: identify()
  },
  connectionGater: {
    denyDialMultiaddr: () => false
  },
  connectionManager: {
    minConnections: 0
  },
  connectionEncryption: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ]
})

node.addEventListener('peer:identify', (event) => {
  console.info('identify completed, supported protocols:', event.detail.protocols)
})

try {
  await node.dial(multiaddr(ma))
} catch (err) {
  console.info('dial failed', err)
}
