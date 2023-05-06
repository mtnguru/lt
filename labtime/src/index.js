import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import {mqttConnect, mqttPublish, mqttSubscribe, mqttUnsubscribe, mqttProcessCB, mqttRegisterTopicCB} from './utils/mqttReact.js';

const f = "index::main - "
global.aaastarted = false;
const clientId = "labtime"

global.aaa = {
  clientId: clientId,
  mqtt: {
    clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
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
      cmd: 'a/cmd/administrator'
    }
  },
}

const loadConfigCB = (topic, payload) => {
  const f = "index::loadConfigCB - "
  console.log(f,'enter', topic)

  if (global.aaastarted) return;
  global.aaastarted = true

  try {
    // Unsubscribe from all any current topics
//  mqttUnsubscribe(global.aaa.topics.subscribe);

    // Replace global.aaa object with new configuration
    global.aaa = JSON.parse(payload.toString(0));

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
  mqttPublish(global.aaa.topics.publish.cmd, payloadStr)
  mqttRegisterTopicCB(global.aaa.topics.subscribe.rsp, loadConfigCB)
  console.log(f,'exit')
}

mqttConnect(mqttProcessCB);
console.log(f,'requestConfig - ')
getConfig();

// const configCB = () => {
//   const promise = new Promise ((resolve, reject) => {
//
//   })
// }
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
