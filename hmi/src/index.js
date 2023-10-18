import React from 'react'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import {BrowserRouter} from 'react-router-dom'
import {mgDebug} from './utils/mg'
import theme from './theme/theme.ts'

import {mqttConnect,
        mqttPublish,
        mqttSubscribe,
        mqttUnsubscribe,
        mqttProcessCB,
        mqttRegisterTopicCB,
        mqttUnregisterTopicCB} from './utils/mqttReact.js';

import seedrandom from 'seedrandom'
const clientId = "hmi"
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3,7)}`
const userId = `user_${generator().toString(16).slice(0,6)}`

const f = "index::main - "

global.aaa = {
  clientId: clientId,
  userId: userId,
  started: false,
  startTime: Date.now(),
  topics: {
    subscribe: {
      rsp: `a/rsp/${clientId}`,
    },
    publish: {
      adm: 'a/cmd/administrator'
    }
  },
  status: {
    debugLevel: 0,
    enabled: 1,
    mqttConnected: 0,
    mqttSubscribe: 0,
    mqttUnsubscribe: 0,
  }
}

// MQTT configuration
global.aam = {
  mqttClientId: mqttClientId,

  // labtime.org
//url: 'mqtt://194.195.214.212:8081',
//username: 'data',
//password: 'datawp',

  // Complex
  url: 'mqtt://192.168.202.108:8081',
  username: 'mqtt',
  password: 'mqttsl',

  protocol: 'MQTT',
  protocolVersion: 4,
  connectTimeout: 60000,
  reconnectPeriod: 120000,
  keepAlive: 5000,
}

const getStatus = () => {
  var timeDiff = parseInt((Date.now() - global.aaa.startTime) / 1000)
  var seconds = Math.round(timeDiff % 60)
  timeDiff = Math.floor(timeDiff / 60)
  var minutes = Math.round(timeDiff % 60)
  timeDiff = Math.floor(timeDiff / 60)
  var hours = Math.round(timeDiff % 24)
  timeDiff = Math.floor(timeDiff / 24)
  var days = timeDiff

  var uptime = ''
  if (days > 0) {
    uptime = `${days} `
  }
  uptime += `${hours}:${minutes}:${seconds}`

  return {
    rsp: "requestStatus",
    clientId: clientId,
    mqttClientId: mqttClientId,
    mqttConnected: global.aaa.status.mqttConnected,
    mqttSubscribe: global.aaa.status.mqttSubscribe,
    mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
    debugLevel: global.aaa.status.debugLevel,
    uptime: uptime,
  }
}

const cmdCB = (_topic, _payload) => {
  const f = "index:cmdCB"
  mgDebug(2,f,'Enter')
  var out
  var topic = global.aaa.topics.publish.rsp
  if (_payload.clientId === clientId || _payload.clientId === 'all') {
    if (_payload.cmd === 'requestStatus') {
      out = JSON.stringify(getStatus())
    }
    if (_payload.cmd === 'setDebugLevel') {
      global.aaa.status.debugLevel = _payload.debugLevel
      out = JSON.stringify({
        rsp: 'setDebugLevel',
        clientId: clientId,
        debugLevel: global.aaa.status.debugLevel,
      })
    }
  }
  if (out) {
    mqttPublish(topic, out)
  }
//mgDebug(2,f,'Exit');
}

const loadConfigCB = (_topic, _payload) => {
  const f = "index::loadConfigCB - "
  console.log(f,'enter', _topic)

  if (global.aaa.started) return;
  _payload.started = true

  mqttUnsubscribe(global.aaa.topics.subscribe);
  mqttUnregisterTopicCB(global.aaa.topics.subscribe.rsp, loadConfigCB,{})

  try {
    // Replace global.aaa object with new configuration
    _payload.startTime = global.aaa.startTime
    _payload.status = global.aaa.status
    _payload.userId = global.aaa.userId
    global.aaa = _payload

    // Create full list of inp and out by combining them from all clients
    global.aaa.inp = {}
    global.aaa.out = {}
    for (var clientId in global.aaa.clients) {
      if (clientId !== "administrator") {
        const client = global.aaa.clients[clientId]
        if (!client) {
          console.log('MqttClient not found ' + clientId);
          continue;
        }
        for (let inputName in client.inp) {
          const input = client.inp[inputName]
          global.aaa.inp[inputName.toLowerCase()] = input;
        }
        for (let outputName in client.out) {
          const output = client.out[outputName]
          global.aaa.out[outputName.toLowerCase()] = output;
        }
      }
    }
  } catch(err) {
    console.log('ERROR in', f, '  Error:', err)
  }
  console.log(f,'exit')

  startReact()
}

const getConfig = () => {
  const f = "index::getConfig - "
  console.log(f,'enter')
  const payloadStr = `{"cmd": "requestConfig", "clientId": "${clientId}"}`
  mqttRegisterTopicCB(global.aaa.topics.subscribe.rsp, loadConfigCB,{})
  mqttPublish(global.aaa.topics.publish.adm, payloadStr)
  console.log(f,'exit')
}

const connectCb = () => {
  getConfig();
//mqttUnsubscribe(global.aaa.topics)
}

/*
fetch("https://api.ipdata.co")
  .then(response => {
    return response.json();
   }, "jsonp")
  .then(res => {
    console.log(res.ip)
  })
  .catch(
    err => console.log(err)
  )
 */

mqttConnect(connectCb, mqttProcessCB);
console.log(f,'requestConfig')

const startReact = () => {
  const f = "index::startReact"
  // Subscribe to topics
  try {
    console.log(f, 'do subscribe', Object.values(global.aaa.topics.subscribe))
    mqttSubscribe(global.aaa.topics.subscribe)
    mqttRegisterTopicCB(global.aaa.topics.register.cmd,cmdCB,{})
    console.log(f, 'enter')
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <BrowserRouter>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChakraProvider theme={theme}>
            <App />
        </ChakraProvider>
      </BrowserRouter>
    );
  } catch(err) {
    console.log('ERROR in', f, '  Error:', err)
  }
}