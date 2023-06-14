// File: groov.js
//
require('dotenv').config();

const { readInputs } = require('./readInputs')
const mqttNode  = require('./utils/mqttNode')
const { msg, setDebugLevel } = require('./utils/msg')
const groov_api = require('./groov_api')
let started = false
const sampling = false

var clientId = process.env.CLIENTID
const seedrandom  = require('seedrandom')
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3)}`

const f = "groov:main"

if (process.argv[2]) {
  clientId = process.argv[2]
}

global.aaa = {
  status: {
    mqttConnected: 0,
    debugLevel: 0,
    enabled: 1,
    sampleInterval: 10000,
  }
}

global.aab = {
  clientId: clientId,
  startTime: Date.now(),
  started: false,
  topics: {
    subscribe: {
      rsp: `a/rsp/${clientId}`,
    },
    publish: {
      adm: 'a/cmd/administrator'
    }
  }
}

global.aam = {
  mqttClientId: mqttClientId,
  url: process.env.MQTT_URL,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  protocol: 'MQTT',
  protocolVersion: 4,
  connectTimeout: 60000,
  reconnectPeriod: 120000,
  keepAlive: 5000
}

/**
 * getConfig() - Read in the configuration file for the groov
 */
const getConfig = () => {
  const f = 'groov::getConfig'

  msg(2, f, DEBUG, 'enter ')
  const payloadStr = `{\"clientId\": \"${clientId}\", \"cmd\": \"requestConfig\"}`
  mqttNode.publish(global.aab.topics.publish.adm, payloadStr)
  mqttNode.registerTopicCB(global.aab.topics.subscribe.rsp, loadConfigCB)
  msg(2, f,DEBUG,'exit')
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
    mqttConnected: global.aaa.status.mqttConnected,
    enabled: global.aaa.status.enabled,
    debugLevel: global.aaa.status.debugLevel,
    sampleInterval: global.aaa.status.sampleInterval,
    uptime: uptime,
  }
}

const cmdCB = (_topic, _payload) => {
  var out;
  payload = JSON.parse(_payload)
  if (payload.cmd === "setEnabled") {
    out = {
      rsp: "setEnabled",
      clientId: global.aaa.clientId,
      enabled: payload.enabled,
    }
  } else if (payload.cmd === "setDebugLevel") {
    out = {
      rsp: "setDebugLevel",
      clientId: global.aaa.clientId,
      debugLevel: payload.debugLevel,
    }
  } else if (payload.cmd === "setSampleInterval") {
    out = {
      rsp: "setSampleInterval",
      clientId: global.aaa.clientId,
      sampleInterval: payload.sampleInterval,
    }
  } else if (payload.cmd === "requestStatus") {
    out = getStatus()
  }
  if (out) {
    mqttNode.publish(global.aaa.topics.publish.rsp, JSON.stringify(out))
  }
}

const loadConfigCB = (_topic, _payload) => {
  const f = "index::loadConfigCB"
  msg(2, f, DEBUG, 'enter ', _topic)

  global.aaa = JSON.parse(_payload.toString())
  mqttNode.subscribe(global.aaa.topics.subscribe)
  mqttNode.registerTopicCB(global.aaa.topics.subscribe.cmd, cmdCB)
  mqttNode.registerTopicCB(global.aaa.topics.subscribe.all, cmdCB)

  for (let metricId in global.aaa.outputs) {
    // Register the metrics that have an output
    const output = global.aaa.outputs[metricId]
    mqttNode.registerMetricCB(metricId, outputCB, "out")
  }

  startGroov()
}

/**
 * startGroov - all is loaded, let's get started
 */
const startGroov = () => {
  const f = 'groov::startGroov'
  msg(2, f, DEBUG,'enter')
  if (!started) {  // Prevents multiple samplers from being started
    started = true
    readInputs();
  }
}

const outputCB = (metric, _topic, _payload, tags, values) => {
  const f = "groov::outputCB"
  msg(2,f,DEBUG, "enter ", _topic)

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
  getConfig();
}

console.log(f,' - connect ')
mqttNode.connect(connectCB, mqttNode.processCB);
console.log(f,' - exit main thread ')