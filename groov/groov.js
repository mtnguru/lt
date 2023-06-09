// File: groov.js
//
require('dotenv').config();

const { readInputs } = require('./readInputs')
const mqttNode  = require('./utils/mqttNode')
const { msg, setDebugLevel } = require('./utils/msg')
const groov_api = require('./groov_api')
let started = false
const sampling = false

const seedrandom  = require('seedrandom')
const generator = seedrandom(Date.now())
const randomNumber = generator();

const f = "groov:main"

var clientId = process.env.CLIENTID
if (process.argv[2]) {
  clientId = process.argv[2]
}

console.log ("Start ", clientId)

global.aaa = {
  clientId: clientId,
  mqtt: {
    clientId: `groov_${randomNumber.toString(16).slice(3)}`, // create a random id
    protocolId: 'MQTT',
    protocolVersion: 4,
    url: process.env.MQTT_URL,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    connectTimeout: 60000,
    reconnectPeriod: 120000,
    keepAlive: 5000
  },
  topics: {
    publish: {
      adm: "a/cmd/administrator"
    },
    subscribe: {
      adm: `a/rsp/${clientId}`,
      cli: `a/cmd/${clientId}`,
      all: "a/cmd/all"
    }
  }
}

/**
 * reqConfig() - Read in the configuration file for the groov
 */
const reqConfig = () => {
  const f = 'groov::reqConfig'

  msg(f, DEBUG, 'enter ')
  const payloadStr = `{\"clientId\": \"${clientId}\", \"cmd\": \"requestConfig\"}`
  mqttNode.publish(global.aaa.topics.publish.adm, payloadStr)
  mqttNode.registerTopicCB(`a/rsp/${global.aaa.clientId}`, loadClientConfigCB)
  msg(f,DEBUG,'exit')
}

const loadClientConfigCB = (_topic, _payload) => {
  const f = "index::loadClientConfigCB"
  msg(f, DEBUG, 'enter ', _topic)

  global.aaa = JSON.parse(_payload.toString())
  mqttNode.subscribe(global.aaa.topics.subscribe)

  for (let metricId in global.aaa.outputs) {
    // Register the metrics that have an output
    const output = global.aaa.outputs[metricId]
    mqttNode.registerMetricCB(metricId, outputCB)
  }

  startGroov()
}

/**
 * startGroov - all is loaded, let's get started
 */
const startGroov = () => {
  msg('groov::startGroov',DEBUG,'enter')
  if (!started) {  // Prevents multiple samplers from being started
    started = true
    readInputs();
  }
}

const outputCB = (metric, _topic, _payload, tags, values) => {
  const f = "groov::outputCB"
  msg(f,DEBUG, "enter ", _topic)

  let value;
  if (values.value === 'On') {
    value = true
  } else if (values.value === 'Off') {
    value = false
  } else if (values.value === '1') {
    value = true
  } else if (values.value === '0') {
    value = false
  }

  groov_api.writeChannel(metric.metricId, metric.output, `\{"value": ${value}\}`)
}

const connectCB = () => {
//mqttNode.publish(global.aaa.topics.publish.all,`{"cmd": "requestStatus", "clientId":"all"}`)
}

console.log(f,' - connect ')
mqttNode.connect(clientId, connectCB, mqttNode.processCB);
setTimeout(() => {
  console.log(f,' - requestConfig ')
  reqConfig();
},1000)
console.log(f,' - exit main thread ')