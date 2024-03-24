// File: simulator.js

/*
  Obtain configuration from administrator

  
 
*/



require('dotenv').config();

const mqttNode  = require('./utils/mqttNode')
const groov_api = require('./groov_api');
const { msg, msgE, setDebugLevel } = require('./utils/msg')
const os = require('os')
let started = false
const sampling = false

var clientId = process.env.CLIENTID
const seedrandom  = require('seedrandom')
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3)}`

let readInterval;
const f = "groov:main"

if (process.argv[2]) {
  clientId = process.argv[2]
}

global.aaa = {
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
  },
  status: {
    mqttConnected: 0,
    mqttSubscribe: 0,
    mqttUnsubscribe: 0,
    debugLevel: 0,
    enabled: 1,
    sampleInterval: 10000,
  }
}

global.aam = {
  mqttClientId: mqttClientId,
  url: process.env.MQTT_URL,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  protocol: 'MQTT',
  protocolVersion: 4,
  connectTimeout: 5000,
  reconnectPeriod: 5000,
  keepAlive: 60,
}

/**
 * getConfig() - Read in the configuration file for the groov
 */
const getConfig = () => {
  const f = 'groov::getConfig'

  msg(2, f, msgE.debug, 'enter ')
  const payloadStr = `{\"clientId\": \"${clientId}\", \"cmd\": \"requestConfig\"}`
  mqttNode.publish(ckTopic("publish","adm"), payloadStr)
  mqttNode.registerTopicCB(ckTopic("subscribe","rsp"), loadConfigCB)
  msg(2, f,msgE.debug,'exit')
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

  global.aaa.status = {
    rsp: "requestStatus",
    clientId: clientId,
    mqttClientId: mqttClientId,
    mqttConnected: global.aaa.status.mqttConnected,
    mqttSubscribe: global.aaa.status.mqttSubscribe,
    mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
    hostname: os.hostname(),
    enabled: global.aaa.status.enabled,
    debugLevel: global.aaa.status.debugLevel,
    sampleInterval: global.aaa.status.sampleInterval,
    uptime: uptime,
  }
  return global.aaa.status
}

const cmdCB = (_topic, _payload) => {
  const f = "groov.js::cmdCB"
  try {
    var out;
    var payload = JSON.parse(_payload)
    if (payload.cmd === "setEnabled") {
      global.aaa.status.enabled = payload.enabled
      out = {
        rsp: "setEnabled",
        clientId: global.aaa.clientId,
        enabled: payload.enabled,
      }
    } else if (payload.cmd === "setDebugLevel") {
      global.aaa.status.debugLevel = payload.debugLevel
      out = {
        rsp: "setDebugLevel",
        clientId: global.aaa.clientId,
        debugLevel: payload.debugLevel,
      }
    } else if (payload.cmd === "setSampleInterval") {
      global.aaa.status.sampleInterval = payload.sampleInterval
      out = {
        rsp: "setSampleInterval",
        clientId: global.aaa.clientId,
        sampleInterval: payload.sampleInterval,
      }
    } else if (payload.cmd === "requestStatus") {
      out = getStatus()
    } else if (payload.cmd === "requestReset") {
      var out = {
        rsp: "requestReset",
        clientId: global.aaa.clientId,
        msg: `Resetting ${global.aaa.clientId}`,
      }
      mqttNode.unsubscribe(global.aaa.topics.subscribe)
      mqttNode.subscribe(global.aaa.topics.subscribe)
    }
    if (out) {
      mqttNode.publish(global.aaa.topics.publish.rsp, JSON.stringify(out))
    }
  } catch(err) {
    msg(0,f, msgE.error, "Error processing:", _topic, "Error", err);
  }
}

const loadConfigCB = (_topic, _payload) => {
  const f = "groov::loadConfigCB"
  msg(2, f, msgE.debug, 'enter ', _topic)

  var config = JSON.parse(_payload.toString())
  if (config.rsp !== 'requestConfig') return;

  mqttNode.unsubscribe(global.aaa.topics.subscribe)
  config.startTime = global.aaa.startTime
  config.status = global.aaa.status
  config.mqttSubscribe = 0;
  config.mqttUnsubscribe = 0;
  config.started = true

  global.aaa = config;
  mqttNode.subscribe(config.topics.subscribe)
  mqttNode.registerTopicCB(config.topics.subscribe.cmd, cmdCB)
  mqttNode.registerTopicCB(config.topics.subscribe.all, cmdCB)

  for (let metricId in config.out) {
    // Register the metrics that have an output
    const output = config.out[metricId]
    mqttNode.registerMetricCB(metricId, outputCB, "out")
  }

  startGroov()
}

/**
 * startGroov - all is loaded, let's get started
 */
const startGroov = () => {
  const f = 'groov::startGroov'
  msg(2, f, msgE.debug,'enter')
  if (!started) {  // Prevents multiple samplers from being started
    started = true
    readInputs();
  }
}

const outputCB = (metric, _topic, _payload, tags, values) => {
  const f = "groov::outputCB"
  msg(2,f,msgE.debug, "enter ", _topic)

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

const stopInputs = () => {
  console.log (f,'start')
  clearInterval(readInterval)
  console.log (f,'stop')
}

const readInput = async (name,input,ctime) => {
  const f = "readInput:readInput - "
  console.log(f, 'enter ', name)

  const channelReadCB = (data) => {
    const f = 'readInput::channelReadCB'
    console.log(f,'enter')
    const topic = global.aaa.topics.publish.inp;
    let payload = `${input.tags} value=${data.value.toFixed(2)}`
    mqttNode.publish(topic, payload)
  }

  await groov_api.readChannel(name, input, channelReadCB)
}

/*
  if (input.lastValue) {
    if (input.lastValue == value)  {
      input.nochange++;
      console.log(' ## ', name, '--------------- ', input.nochange, ' no change', value)
    } else {
      input.nochange = 0;
      console.log(' ## ', name, '-- change ', value)
      // Format the influxdb line protocol
      let line = `${input.tags} value=${value} ${ctime}`;
      console.log('      ', input.topic, line);
      mqttNode.publish(input.topic, line)
    }
  } else {
    input.nochange = 0;
  }
  input.lastValue = value;
  console.log (f,'exit')
 */

const readInputs = async () => {
  const f = "readInputs:readInputs - "
  readInterval = setInterval(async () => {
    if (!global.aaa.status.enabled) return
    console.log (f, 'enter')
//  const start = performance.now();
    const ntime = new Date().getTime() * 1000000;

    const funcs = [];
    for (let name in global.aaa.inp) {
      let input = global.aaa.inp[name].input;
      funcs.push(readInput(name,input,ntime));
    }

    await Promise.all(funcs)

//  const end = performance.now();
//  console.log (f, 'end ', end - start)
  }, global.aaa.status.sampleInterval)
}

module.exports = { readInputs }


const connectCB = () => {
  getConfig();
}

console.log(f,' - connect ')
mqttNode.connect(connectCB, mqttNode.processCB);
console.log(f,' - exit main thread ')
