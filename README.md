# Firefox identify issue with go-libp2p

TLDR: go-libp2p appears to be closing the WebTransport stream used for identify when Firefox attempts to read the multistream select requested protocol response.

---

## Overview

There are two scripts in this repo:

1. `go-libp2p.js`

Starts a `go-libp2p@0.35.0` process listening on a webtransport address.

2. `browser.js`

Intended to be run in Chromium or Firefox, it starts a js-libp2p node and dials the go-libp2p process, printing out the protocols supported by go-libp2p after identify has run.

In this repo we'll use `playwright-test` to run the script in Chromium/Firefox in headless mode.

## Usage

1. Start the go-libp2p node

```console
% npm run start:go-libp2p

> circuit-relay-reservations@1.0.0 start:go-libp2p
> node go-libp2p.js

2024-05-29T12:07:33.391+0100    DEBUG   rcmgr   resource-manager/limit.go:84    initializing new limiter with config    {"limits": {}}
2024-05-29T12:07:33.393+0100    DEBUG   p2p-config      config/log.go:21        [Fx] PROVIDE    fx.Lifecycle <= go.uber.org/fx.New.func1()
2024-05-29T12:07:33.393+0100    DEBUG   p2p-config      config/log.go:21        [Fx] PROVIDE    fx.Shutdowner <= go.uber.org/fx.(*App).shutdowner-fm()
...lots of output
2024-05-29T12:07:33.397+0100    DEBUG   p2pd    go-libp2p-daemon/daemon.go:172  incoming connection
2024-05-29T12:07:33.399+0100    DEBUG   p2pd    go-libp2p-daemon/conn.go:38     request {"type": "IDENTIFY"}


// Replace the "ma" variable declaration in browser.js with:

const ma = '/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC'
```

2. Follow the instructions and replace the `ma` variable declaration in `browser.js`
3. Run chromium:

```console
% npm run start:chromium

> circuit-relay-reservations@1.0.0 start:chromium
> playwright-test ./browser.js --browser chromium

- Count not find a test runner. Using "none".
ℹ Browser "chromium" setup complete.
identify completed, supported protocols: [
  '/echo/1.0.0',
  '/ipfs/id/1.0.0',
  '/ipfs/id/push/1.0.0',
  '/ipfs/ping/1.0.0',
  '/libp2p/circuit/relay/0.2.0/hop',
  '/libp2p/circuit/relay/0.2.0/stop'
]
```

All good!

4. Run firefox:

```console
% npm run start:firefox

> circuit-relay-reservations@1.0.0 start:firefox
> playwright-test ./browser.js --browser firefox

- Count not find a test runner. Using "none".
ℹ Browser "firefox" setup complete.
// no further output, identify never completes
```

## What's going on?

Run again with js debug logs:

```console
% DEBUG=libp2p*,*:trace npm run start:firefox

> circuit-relay-reservations@1.0.0 start:firefox
> playwright-test ./browser.js --browser firefox

- Count not find a test runner. Using "none".
ℹ Browser "firefox" setup complete.
libp2p:transports  adding transport @libp2p/webtransport  +0ms
libp2p  libp2p is starting  +0ms
libp2p:connection-manager  started  +0ms
libp2p:peer-store:trace  merge await write lock  +0ms
libp2p:peer-store:trace  merge got write lock  +0ms
libp2p:peer-store:trace  merge release write lock  +1ms
libp2p:peer-store:trace  merge await write lock  +1ms
libp2p:peer-store:trace  merge got write lock  +0ms
libp2p:peer-store:trace  merge release write lock  +0ms
libp2p:transports  no addresses were provided for listening, this node is dial only  +3ms
libp2p:peer-store:trace  all await read lock  +1ms
libp2p:peer-store:trace  all got read lock  +0ms
libp2p  libp2p has started  +3ms
libp2p:connection-manager  dial 12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC  +4ms
libp2p:peer-store:trace  all release read lock  +2ms
libp2p:webtransport  dialing /ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC  +0ms
libp2p:webtransport  wait for session to be ready  +1ms
libp2p:webtransport  session became ready  +4ms
libp2p:noise:xxhandshake:trace  Stage 0 - Initiator starting to send first message.  +0ms
libp2p:noise:xxhandshake:trace  Stage 0 - Initiator finished sending first message.  +3ms
libp2p:noise:xxhandshake:trace  Stage 1 - Initiator waiting to receive first message from responder...  +0ms
libp2p:connection-manager:dial-queue  creating dial target for 12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC  +0ms [
  '/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC'
]
libp2p:connection-manager:dial-queue:trace  addresses for 12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC before filtering  +0ms [
  '/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC'
]
libp2p:connection-manager:dial-queue:trace  addresses for 12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC after filtering  +0ms [
  '/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC'
]
libp2p:noise:xxhandshake:trace  Stage 1 - Initiator received the message.  +6ms
libp2p:noise:xxhandshake:trace  Initiator going to check remote's signature...  +0ms
libp2p:noise:xxhandshake:trace  All good with the signature!  +2ms
libp2p:noise:xxhandshake:trace  Stage 2 - Initiator sending third handshake message.  +0ms
libp2p:noise:xxhandshake:trace  Stage 2 - Initiator sent message with signed payload.  +1ms
libp2p:webtransport:maconn  starting the outbound connection upgrade  +0ms
libp2p:webtransport:maconn  successfully upgraded outbound connection  +0ms
libp2p:connection-manager:connection-pruner  checking max connections limit 1/100  +0ms
libp2p:connection:outbound:3bpevn1716981021895  starting new stream for protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:muxer  new outgoing stream  +0ms undefined
libp2p:connection-manager:dial-queue  dial to /ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw/p2p/12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC succeeded  +25ms
libp2p:webtransport:stream:inbound:0:trace  handle: available protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:stream:inbound:0:trace  sink reading from source  +1ms
libp2p:webtransport:stream:inbound:0:trace  handle: reading incoming string  +0ms
libp2p:connection:outbound:3bpevn1716981021895:trace  started new stream 1 for protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:stream:outbound:1:trace  selecting protocol from protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink reading from source  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: write ["/multistream/1.0.0", "/ipfs/id/1.0.0"]  +0ms
libp2p:webtransport:stream:outbound:1  sendData waiting for writer to be ready  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: reading multistream-select header  +0ms
libp2p:webtransport:stream:inbound:0:trace  handle: read "/multistream/1.0.0"  +1ms
libp2p:webtransport:stream:inbound:0:trace  handle: respond with "/multistream/1.0.0" for "/multistream/1.0.0"  +0ms
libp2p:webtransport:stream:inbound:0  sendData waiting for writer to be ready  +0ms
libp2p:webtransport:stream:inbound:0:trace  handle: responded with "/multistream/1.0.0" for "/multistream/1.0.0"  +1ms
libp2p:webtransport:stream:inbound:0:trace  handle: reading incoming string  +0ms
libp2p:webtransport:stream:inbound:0:trace  handle: read "/ipfs/id/1.0.0"  +0ms
libp2p:webtransport:stream:inbound:0:trace  handle: respond with "/ipfs/id/1.0.0" for "/ipfs/id/1.0.0"  +0ms
libp2p:webtransport:stream:inbound:0  sendData waiting for writer to be ready  +1ms
libp2p:webtransport:stream:inbound:0:trace  handle: responded with "/ipfs/id/1.0.0" for "/ipfs/id/1.0.0"  +0ms
libp2p:connection:outbound:3bpevn1716981021895  incoming stream opened on /ipfs/id/1.0.0  +4ms
libp2p:peer-store:trace  merge await write lock  +28ms
libp2p:peer-store:trace  merge got write lock  +0ms
libp2p:peer-store:trace  merge release write lock  +0ms
libp2p:peer-store:trace  get await read lock  +0ms
libp2p:peer-store:trace  get got read lock  +0ms
libp2p:peer-store:trace  get release read lock  +0ms
libp2p:webtransport:stream:inbound:0  sendData waiting for writer to be ready  +1ms
libp2p:webtransport:stream:inbound:0:trace  closing gracefully  +1ms
libp2p:webtransport:stream:inbound:0:trace  closing writable end of stream with starting write status "writing"  +0ms
libp2p:webtransport:stream:inbound:0:trace  closing readable end of stream with starting read status "ready"  +0ms
libp2p:webtransport:stream:inbound:0:trace  send close read to remote  +0ms
libp2p:webtransport:stream:inbound:0  sendCloseRead cancelling reader  +0ms
libp2p:webtransport:stream:inbound:0  remote closed write  +0ms
libp2p:webtransport:stream:inbound:0  received remote close write but local source is already closed  +0ms
libp2p:webtransport:stream:inbound:0:trace  aborting source passed to .sink  +0ms
libp2p:webtransport:stream:inbound:0  sendCloseRead cancelled reader  +0ms
libp2p:webtransport:stream:inbound:0:trace  ending internal source queue with 0 queued bytes  +0ms
libp2p:webtransport:stream:inbound:0:trace  source ended  +0ms
libp2p:webtransport:stream:inbound:0:trace  source ended, waiting for sink to end  +0ms
libp2p:webtransport:stream:inbound:0:trace  closed readable end of stream  +1ms
libp2p:webtransport:stream:inbound:0:trace  sink finished reading from source, write status is "writing"  +0ms
libp2p:webtransport:stream:inbound:0:trace  send close write to remote  +0ms
libp2p:webtransport:stream:inbound:0  sendCloseWrite closing writer  +1ms
libp2p:webtransport:stream:inbound:0  writer closed  +0ms
libp2p:webtransport:stream:inbound:0  sendCloseWrite closed writer  +0ms
libp2p:webtransport:stream:inbound:0  received remote close read but local sink is already closed  +0ms
libp2p:webtransport:stream:inbound:0:trace  sink and source ended  +0ms
libp2p:webtransport:stream:inbound:0:trace  resolve sink end  +0ms
libp2p:webtransport:stream:inbound:0:trace  closed writable end of stream  +0ms
libp2p:webtransport:stream:inbound:0:trace  closed gracefully  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: read "/multistream/1.0.0"  +4ms
libp2p:webtransport:stream:outbound:1:trace  select: reading protocol response  +0ms
libp2p:webtransport:stream:outbound:1:trace  remote close read  +1ms
libp2p:webtransport:stream:outbound:1:trace  end sink source  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink ended, waiting for source to end  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink finished reading from source, write status is "closed"  +0ms
libp2p:webtransport:stream:outbound:1:trace  resolve sink end  +0ms
libp2p:webtransport:stream:outbound:1  try to send reset to remote  +0ms
libp2p:webtransport:stream:outbound:1  sendReset aborting writer  +0ms
libp2p:webtransport:stream:outbound:1:trace  ending source with 0 bytes to be read by consumer  +0ms
libp2p:webtransport:stream:outbound:1:trace  source and sink ended  +0ms
libp2p:webtransport:stream:outbound:1  received remote close write but local source is already closed  +1ms
libp2p:webtransport:stream:outbound:1  sendReset aborted writer  +0ms
libp2p:webtransport:stream:outbound:1  writer close promise rejected  +5ms WebTransportError: WebTransportStream StopSending

libp2p:webtransport:stream:outbound:1:error  error reading from stream  +0ms TypeError: Error in input stream

libp2p:webtransport:stream:outbound:1  abort with error  +0ms TypeError: Error in input stream

libp2p:webtransport:stream:outbound:1:trace  source ended with error  +0ms TypeError: Error in input stream

libp2p:connection:outbound:3bpevn1716981021895:error  could not create new stream for protocols /ipfs/id/1.0.0  +0ms TypeError: Error in input stream

libp2p:identify:error  error while reading identify message  +0ms CodeError: TypeError: Error in input stream
CodeError@http://127.0.0.1:61981/bundle-out.js:4524:9
newStream@http://127.0.0.1:61981/bundle-out.js:26265:21
async*newStream@http://127.0.0.1:61981/bundle-out.js:25871:35
_identify@http://127.0.0.1:61981/bundle-out.js:30015:37
identify@http://127.0.0.1:61981/bundle-out.js:30032:37
node_modules/@libp2p/identify/dist/src/identify.js/Identify2/<@http://127.0.0.1:61981/bundle-out.js:29998:18
dispatchEvent@http://127.0.0.1:61981/bundle-out.js:4609:30
node_modules/libp2p/dist/src/libp2p.js/Libp2pNode/events2.dispatchEvent@http://127.0.0.1:61981/bundle-out.js:26510:50
safeDispatchEvent@http://127.0.0.1:61981/bundle-out.js:4619:21
_createConnection@http://127.0.0.1:61981/bundle-out.js:26336:21
upgradeOutbound@http://127.0.0.1:61981/bundle-out.js:26141:21
async*dial@http://127.0.0.1:61981/bundle-out.js:29490:41
async*dial@http://127.0.0.1:61981/bundle-out.js:24825:34
node_modules/libp2p/dist/src/connection-manager/dial-queue.js/dial/<@http://127.0.0.1:61981/bundle-out.js:23498:69
async*run@http://127.0.0.1:61981/bundle-out.js:22583:48
tryToStartAnother@http://127.0.0.1:61981/bundle-out.js:22668:15
add@http://127.0.0.1:61981/bundle-out.js:22714:14
dial@http://127.0.0.1:61981/bundle-out.js:23473:27
openConnection@http://127.0.0.1:61981/bundle-out.js:23969:49
dial@http://127.0.0.1:61981/bundle-out.js:26665:50
browser.js@http://127.0.0.1:61981/bundle-out.js:31171:18
async*__init@http://127.0.0.1:61981/bundle-out.js:15:56
@http://127.0.0.1:61981/bundle-out.js:31643:7

libp2p:identify:error  error during identify trigged by connection:open  +0ms CodeError: TypeError: Error in input stream
CodeError@http://127.0.0.1:61981/bundle-out.js:4524:9
newStream@http://127.0.0.1:61981/bundle-out.js:26265:21
async*newStream@http://127.0.0.1:61981/bundle-out.js:25871:35
_identify@http://127.0.0.1:61981/bundle-out.js:30015:37
identify@http://127.0.0.1:61981/bundle-out.js:30032:37
node_modules/@libp2p/identify/dist/src/identify.js/Identify2/<@http://127.0.0.1:61981/bundle-out.js:29998:18
dispatchEvent@http://127.0.0.1:61981/bundle-out.js:4609:30
node_modules/libp2p/dist/src/libp2p.js/Libp2pNode/events2.dispatchEvent@http://127.0.0.1:61981/bundle-out.js:26510:50
safeDispatchEvent@http://127.0.0.1:61981/bundle-out.js:4619:21
_createConnection@http://127.0.0.1:61981/bundle-out.js:26336:21
upgradeOutbound@http://127.0.0.1:61981/bundle-out.js:26141:21
async*dial@http://127.0.0.1:61981/bundle-out.js:29490:41
async*dial@http://127.0.0.1:61981/bundle-out.js:24825:34
node_modules/libp2p/dist/src/connection-manager/dial-queue.js/dial/<@http://127.0.0.1:61981/bundle-out.js:23498:69
async*run@http://127.0.0.1:61981/bundle-out.js:22583:48
tryToStartAnother@http://127.0.0.1:61981/bundle-out.js:22668:15
add@http://127.0.0.1:61981/bundle-out.js:22714:14
dial@http://127.0.0.1:61981/bundle-out.js:23473:27
openConnection@http://127.0.0.1:61981/bundle-out.js:23969:49
dial@http://127.0.0.1:61981/bundle-out.js:26665:50
browser.js@http://127.0.0.1:61981/bundle-out.js:31171:18
async*__init@http://127.0.0.1:61981/bundle-out.js:15:56
@http://127.0.0.1:61981/bundle-out.js:31643:7
```

The error is:

```
libp2p:identify:error  error during identify trigged by connection:open  +0ms CodeError: TypeError: Error in input stream
```

The stream that errors is `libp2p:webtransport:stream:outbound:1` so the relevant logs are:

```
libp2p:connection:outbound:3bpevn1716981021895:trace  started new stream 1 for protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:stream:outbound:1:trace  selecting protocol from protocols /ipfs/id/1.0.0  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink reading from source  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: write ["/multistream/1.0.0", "/ipfs/id/1.0.0"]  +0ms
libp2p:webtransport:stream:outbound:1  sendData waiting for writer to be ready  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: reading multistream-select header  +0ms
libp2p:webtransport:stream:outbound:1:trace  select: read "/multistream/1.0.0"  +4ms
libp2p:webtransport:stream:outbound:1:trace  select: reading protocol response  +0ms
libp2p:webtransport:stream:outbound:1:trace  remote close read  +1ms
libp2p:webtransport:stream:outbound:1:trace  end sink source  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink ended, waiting for source to end  +0ms
libp2p:webtransport:stream:outbound:1:trace  sink finished reading from source, write status is "closed"  +0ms
libp2p:webtransport:stream:outbound:1:trace  resolve sink end  +0ms
libp2p:webtransport:stream:outbound:1  try to send reset to remote  +0ms
libp2p:webtransport:stream:outbound:1  sendReset aborting writer  +0ms
libp2p:webtransport:stream:outbound:1:trace  ending source with 0 bytes to be read by consumer  +0ms
libp2p:webtransport:stream:outbound:1:trace  source and sink ended  +0ms
libp2p:webtransport:stream:outbound:1  received remote close write but local source is already closed  +1ms
libp2p:webtransport:stream:outbound:1  sendReset aborted writer  +0ms
libp2p:webtransport:stream:outbound:1  writer close promise rejected  +5ms WebTransportError: WebTransportStream StopSending
libp2p:webtransport:stream:outbound:1:error  error reading from stream  +0ms TypeError: Error in input stream
libp2p:webtransport:stream:outbound:1  abort with error  +0ms TypeError: Error in input stream
libp2p:webtransport:stream:outbound:1:trace  source ended with error  +0ms TypeError: Error in input stream
libp2p:connection:outbound:3bpevn1716981021895:error  could not create new stream for protocols /ipfs/id/1.0.0  +0ms TypeError: Error in input stream
libp2p:identify:error  error while reading identify message  +0ms CodeError: TypeError: Error in input stream
libp2p:identify:error  error during identify trigged by connection:open  +0ms CodeError: TypeError: Error in input stream
```

..so it:

1. Opens a new WebTransport stream
2. Writes a multistream-select message: `/multistream/1.0.0\n/ipfs/id/1.0.0`
3. Reads the multistream-select protocol response: `/multistream/1.0.0`
4. Starts to read the protocol response
5. The underlying browser stream readable reader throws `TypeError: Error in input stream`

Relevant go-libp2p logs:

1. With Chromium as a client:

```
2024-05-29T12:17:12.736+0100    DEBUG   swarm2  swarm/swarm_listen.go:141       swarm listener accepted connection: /ip4/127.0.0.1/udp/62837/quic-v1/webtransport <-> /ip4/127.0.0.1/udp/64211/quic-v1/webtransport
2024-05-29T12:17:12.740+0100    DEBUG   net/identify    identify/id.go:545      /ipfs/id/1.0.0 received message from 12D3KooWG3UTYF3fHNpawPKFpqttPc7wu5YP98srTDn4TPKP9JZR /ip4/127.0.0.1/udp/64211/quic-v1/webtransport
2024-05-29T12:17:12.740+0100    DEBUG   net/identify    identify/id.go:834      12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC received listen addrs for 12D3KooWG3UTYF3fHNpawPKFpqttPc7wu5YP98srTDn4TPKP9JZR: []
2024-05-29T12:17:12.740+0100    DEBUG   basichost       basic/basic_host.go:447 negotiated: /ipfs/id/1.0.0 (took 1.826584ms)
2024-05-29T12:17:12.740+0100    DEBUG   net/identify    identify/id.go:489      sending snapshot        {"seq": 3, "protocols": ["/echo/1.0.0","/ipfs/id/1.0.0","/ipfs/id/push/1.0.0","/ipfs/ping/1.0.0","/libp2p/circuit/relay/0.2.0/hop","/libp2p/circuit/relay/0.2.0/stop"], "addrs": ["/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw"]}
2024-05-29T12:17:12.740+0100    DEBUG   net/identify    identify/id.go:494      /ipfs/id/1.0.0 sending message to 12D3KooWG3UTYF3fHNpawPKFpqttPc7wu5YP98srTDn4TPKP9JZR /ip4/127.0.0.1/udp/64211/quic-v1/webtransport
```

2. With Firefox

```
2024-05-29T12:18:01.948+0100    DEBUG   swarm2  swarm/swarm_listen.go:141       swarm listener accepted connection: /ip4/127.0.0.1/udp/62837/quic-v1/webtransport <-> /ip4/127.0.0.1/udp/51022/quic-v1/webtransport
2024-05-29T12:18:01.952+0100    DEBUG   basichost       basic/basic_host.go:447 negotiated: /ipfs/id/1.0.0 (took 1.602541ms)
2024-05-29T12:18:01.952+0100    DEBUG   net/identify    identify/id.go:489      sending snapshot        {"seq": 3, "protocols": ["/echo/1.0.0","/ipfs/id/1.0.0","/ipfs/id/push/1.0.0","/ipfs/ping/1.0.0","/libp2p/circuit/relay/0.2.0/hop","/libp2p/circuit/relay/0.2.0/stop"], "addrs": ["/ip4/127.0.0.1/udp/62837/quic-v1/webtransport/certhash/uEiDrfSfvDUF4v8BX-rQLUlDp3UCGjPsNW1zbBzhgK-wgVg/certhash/uEiDNPrYvdaT3JsAwXAipUiB53u9Wj4syFvzEYBStExjakw"]}
2024-05-29T12:18:01.952+0100    DEBUG   net/identify    identify/id.go:494      /ipfs/id/1.0.0 sending message to 12D3KooWFT6dTJFbUFuu5waVRgozWFnfjkRH1rmo7X3Fwq7VBCTA /ip4/127.0.0.1/udp/51022/quic-v1/webtransport
2024-05-29T12:18:01.955+0100    DEBUG   net/identify    identify/id.go:545      /ipfs/id/1.0.0 received message from 12D3KooWFT6dTJFbUFuu5waVRgozWFnfjkRH1rmo7X3Fwq7VBCTA /ip4/127.0.0.1/udp/51022/quic-v1/webtransport
2024-05-29T12:18:01.955+0100    DEBUG   net/identify    identify/id.go:834      12D3KooWHSUhQYG1ZxgiBL48hHT4pgoCP3QJUj2ZNomAkWJ5FkUC received listen addrs for 12D3KooWFT6dTJFbUFuu5waVRgozWFnfjkRH1rmo7X3Fwq7VBCTA: []
```

From what I can see the messages are the same but the order is different?
