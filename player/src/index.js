import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.scss';
import {mqttConnect, mqttPublish, mqttSubscribe, mqttUnsubscribe, mqttProcessCB, mqttRegisterTopicCB} from './utils/mqttReact.js';

const f = "index::main - "
const clientid = 'player'

global.aaa = {
  name: clientid,
  mqtt: {
    clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
    protocolId: 'MQTT',
    protocolVersion: 4,
    //  connectUrl: 'mqtt://194.195.214.212:8081',
    //  connectUrl: 'mqtt://labtime.webhop.net:8081',
    connectUrl: 'mqtt://localhost:8081',
    //  connectUrl: 'mqtt://172.16.45.7:8081',
    username: 'data',
    password: 'datawp',
    connectTimeout: 10000,
    reconnectPeriod: 120000,
    keepAlive: 5000,
  },
  subscribeTopics: {
    admin: `a/rsp/${clientid}`
  },
}

const loadConfigCB = (topic, payload) => {
  const f = "index::loadConfigCB - "
  console.log(f,'enter', topic)

  if (global.aaastarted) return;
  global.aaastarted = true

  try {
    // Unsubscribe from all any current topics
    mqttUnsubscribe(global.aaa.subscribeTopics);

    // Replace global.aaa object with new configuration
    global.aaa = JSON.parse(payload.toString(0));

    // Subscribe to topics
    console.log(f, 'do subscribe', Object.values(global.aaa.subscribeTopics))
    mqttSubscribe(global.aaa.subscribeTopics)

    // Create full list of inputs and outputs by combining them from all clients
    global.aaa.inputs = {}
    global.aaa.outputs = {}
    for (let clientName in global.aaa.clients) {
      if (clientName !== "server") {
        const client = global.aaa.clients[clientName]
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
  const topic = `a/cmd/${clientid}`
  const payloadStr = '{"cmd":"getConfig"}'
  mqttPublish(topic, payloadStr)
  mqttRegisterTopicCB(`a/rsp/${clientid}`, loadConfigCB)
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
//const f = "index::startReact"
  console.log(f, 'enter')
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App/>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
