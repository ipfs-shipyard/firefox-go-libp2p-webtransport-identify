import { execa } from 'execa'
import { path as p2pd } from 'go-libp2p'
import { createClient } from '@libp2p/daemon-client'
import pDefer from 'p-defer'
import { multiaddr } from '@multiformats/multiaddr'

const controlPort = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000
const apiAddr = multiaddr(`/ip4/127.0.0.1/tcp/${controlPort}`)
const deferred = pDefer()
const proc = execa(p2pd(), [
  `-listen=${apiAddr.toString()}`,
  '-hostAddrs=/ip4/127.0.0.1/udp/0/quic-v1/webtransport',
  '-noise=true',
  '-muxer=yamux'
], {
  reject: false,
  env: {
    GOLOG_LOG_LEVEL: 'debug'
  }
})

proc.stdout?.on('data', (buf) => {
  const str = buf.toString()

  // daemon has started
  if (str.includes('Control socket:')) {
    deferred.resolve()
  }
})
proc.stderr?.on('data', (buf) => {
  process.stderr.write(buf)
})

await deferred.promise

const daemonClient = createClient(apiAddr)
const id = await daemonClient.identify()

const wtAddr = id.addrs.filter(ma => ma.toString().includes('/quic-v1/webtransport/'))
  .pop()
  .encapsulate(`/p2p/${id.peerId}`)

console.info(`

// Replace the "ma" variable declaration in browser.js with:

const ma = '${wtAddr}'

`)
