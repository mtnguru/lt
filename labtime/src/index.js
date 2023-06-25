import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import {mgNotify, mgDebug} from './utils/mg'

import {mqttConnect,
        mqttPublish,
        mqttSubscribe,
        mqttUnsubscribe,
        mqttProcessCB,
        mqttRegisterTopicCB,
        mqttUnregisterTopicCB} from './utils/mqttReact.js';

import seedrandom from 'seedrandom'
const clientId = "labtime"
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3)}`

const f = "index::main - "

global.aaa = {
  status: {
    debugLevel: 0,
    enabled: 1,
    mqttConnected: 0,
  }  
}
 

// Initial configuration to get the client started
global.aab = {
  clientId: clientId,
  started: false,
  startTime: Date.now(),
  topics: {
    subscribe: {
      rsp: `a/admin/rsp/${clientId}`,
    },
    publish: {
      adm: 'a/admin/cmd/administrator'
    }
  },
}

global.aam = {
  mqttClientId: mqttClientId,
  url: 'mqtt://labtime.org:8081',
//url: 'mqtt://194.195.214.212:8081',
//url: 'mqtt://192.168.122.90:8081',
//url: 'mqtt://172.16.45.7:8081',     // merlin
  username: 'data',
  password: 'datawp',
  protocol: 'MQTT',
  protocolVersion: 4,
  connectTimeout: 60000,
  reconnectPeriod: 120000,
  keepAlive: 5000,
}

const getStatus = () => {
  var timeDiff = parseInt((Date.now() - global.aab.startTime) / 1000)
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
    mqttConnected: global.aaa.status.connected,
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

  if (global.aab.started) return;
  global.aab.started = true

  mqttUnsubscribe(global.aab.topics.subscribe);
  mqttUnregisterTopicCB(global.aab.topics.subscribe.rsp, loadConfigCB,{})

  try {
    // Replace global.aaa object with new configuration
//  _payload.topics.subscribe.rsp = global.aab.topics.subscribe.rsp
    _payload.topics.publish.adm = global.aab.topics.publish.adm
    global.aaa = _payload

    // Create full list of inputs and outputs by combining them from all clients
    global.aaa.inputs = {}
    global.aaa.outputs = {}
    for (var clientId in global.aaa.clients) {
      if (clientId !== "administrator") {
        const client = global.aaa.clients[clientId]
        if (!client) {
          console.log('MqttClient not found ' + clientId);
          continue;
        }
        for (let inputName in client.inputs) {
          const input = client.inputs[inputName]
          global.aaa.inputs[inputName.toLowerCase()] = input;
        }
        for (let outputName in client.outputs) {
          const output = client.outputs[outputName]
          global.aaa.outputs[outputName.toLowerCase()] = output;
        }
      }
    }
  } catch(err) {
    console.log(f,'ERROR', err)
  }
  console.log(f,'exit')

  startReact()
}

const getConfig = () => {
  const f = "index::getConfig - "
  console.log(f,'enter')
  const payloadStr = `{"cmd": "requestConfig", "clientId": "${clientId}"}`
  mqttRegisterTopicCB(global.aab.topics.subscribe.rsp, loadConfigCB,{})
  mqttPublish(global.aab.topics.publish.adm, payloadStr)
  console.log(f,'exit')
}

mqttConnect(mqttProcessCB);
console.log(f,'requestConfig')
getConfig();

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
        <App/>
      </BrowserRouter>
    );
  } catch(err) {
    console.log('ERROR in', f, '  Error:', err)
  }
}
