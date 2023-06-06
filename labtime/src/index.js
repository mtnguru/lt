import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import {mqttConnect,
        mqttPublish,
        mqttSubscribe,
//      mqttUnsubscribe,
        mqttProcessCB,
        mqttRegisterTopicCB,
        mqttUnregisterTopicCB} from './utils/mqttReact.js';

const f = "index::main - "
global.aaastarted = false;
const clientId = "labtime"

global.aaa = {
  clientId: clientId,
  status: {
    debugLevel: 0,
  },
  mqtt: {
    clientId: `labtime_${Math.random().toString(16).slice(3)}`, // create a random id
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

const loadConfigCB = (_topic, _payload) => {
  const f = "index::loadConfigCB - "
  console.log(f,'enter', _topic)

  mqttUnregisterTopicCB(global.aaa.topics.subscribe.rsp,loadConfigCB)

  if (global.aaastarted) return;
  global.aaastarted = true

  try {
    // Unsubscribe from all any current topics
//  mqttUnsubscribe(global.aaa.topics.subscribe);

    // Replace global.aaa object with new configuration
    const conf = JSON.parse(_payload.toString(0));
    conf.topics.subscribe.rsp = global.aaa.topics.subscribe.rsp
    conf.topics.publish.adm = global.aaa.topics.publish.adm
    global.aaa = conf

    // Subscribe to topics
    console.log(f, 'do subscribe', Object.values(global.aaa.topics.subscribe))
    mqttSubscribe(global.aaa.topics.subscribe)
//  mqttRegisterTopicCB

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
  mqttRegisterTopicCB(global.aaa.topics.subscribe.rsp, loadConfigCB)
  mqttPublish(global.aaa.topics.publish.adm, payloadStr)
  console.log(f,'exit')
}

mqttConnect(mqttProcessCB);
console.log(f,'requestConfig - ')
getConfig();

const startReact = () => {
  const f = "index::startReact"
  console.log(f, 'enter')
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  );
}
