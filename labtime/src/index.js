import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import {mgNotify, mgDebug} from './utils/mg'

import {mqttConnect,
        mqttPublish,
        mqttSubscribe,
//      mqttUnsubscribe,
        mqttProcessCB,
        mqttRegisterTopicCB,
        mqttUnregisterTopicCB} from './utils/mqttReact.js';

import seedrandom from 'seedrandom'

const generator = seedrandom(Date.now())
const randomNumber = generator();

const f = "index::main - "
global.aaastarted = false;
const clientId = "labtime"

global.aaa = {
  clientId: clientId,
  status: {
    debugLevel: 0,
  },
  mqtt: {
    clientId: `labtime_${randomNumber.toString(16).slice(3)}`, // create a random id
    protocolId: 'MQTT',
    protocolVersion: 4,
    connectUrl: 'mqtt://labtime.org:8081',
//  connectUrl: 'mqtt://194.195.214.212:8081',
//  connectUrl: 'mqtt://labtime.webhop.net:8081',
//  connectUrl: 'mqtt://192.168.122.90:8081',
//  connectUrl: 'mqtt://172.16.45.7:8081',
    username: 'data',
    password: 'datawp',
    connectTimeout: 10000,
    reconnectPeriod: 120000,
    keepAlive: 5000,
  },
  topics: {
    subscribe: {
      rsp: 'a/rsp/labtime',
    },
    publish: {
      adm: 'a/cmd/administrator'
    }
  },
}

const cmdCB = (_topic, _payload) => {
  const f = "index:cmdCB"
//mgDebug(2,f,'Enter');

//mgDebug(2,f,'Exit');
}

const loadConfigCB = (_topic, _payload) => {
  const f = "index::loadConfigCB - "
  console.log(f,'enter', _topic)

  mqttUnregisterTopicCB(global.aaa.topics.subscribe.rsp,loadConfigCB,{})

  if (global.aaastarted) return;
  global.aaastarted = true

  try {
    // Unsubscribe from all any current topics
//  mqttUnsubscribe(global.aaa.topics.subscribe);

    // Replace global.aaa object with new configuration
    _payload.topics.subscribe.rsp = global.aaa.topics.subscribe.rsp
    _payload.topics.publish.adm = global.aaa.topics.publish.adm
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
  mqttRegisterTopicCB(global.aaa.topics.subscribe.rsp, loadConfigCB,{})
  mqttPublish(global.aaa.topics.publish.adm, payloadStr)
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
    mqttRegisterTopicCB(global.aaa.topics.subscribe.cmd,cmdCB,{})
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