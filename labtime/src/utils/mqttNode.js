/**
 * File mqttNode.js
 */

require('./msgE')
const {msg, msgn, setDebugLevel} = require('../utils/msg.js')
const mqtt=require('mqtt');
const {extractFromTags} = require('./influx')
const {findMetric} = require('./metrics')
// require('dotenv').config();

let mqttClient;
let topicsCB = {}

/**
 * connect - connect to the MQTT broker, set callback, subscribe to topics
 * @param cb
 */
const connect = (connectCB, messageCB) => {
  const f = 'mqttNode:connect'
//msg(3,f,DEBUG, 'enter')
  const mc = global.aam;
  topicsCB ={};

  const onConnectPromise = () => {
    const f = "mqttNode::onConnectPromise"
    return new Promise((resolve, reject) => {
      mqttClient.on('connect', (event) => {
        msg(1,f,NOTIFY,'Connected to MQTT broker ' + mc.url)
        mqttClient.unsubscribe([])
        var topics = (global.aab && global.aab.topics) ? global.aab.topics.subscribe : global.aaa.topics.subscribe
        mqttClient.subscribe(Object.values(topics), () => {
          connectCB();
          mqttClient.on('message', (inTopic, payloadRaw) => {
            msg(3,f,NOTIFY,'MQTT message received ', inTopic)
            messageCB(inTopic, payloadRaw)
          })
        })
        resolve('connected')
      })
    })
  }

  mqttClient = mqtt.connect((mc.ip) ? mc.ip: mc.url, {
                            clientId: mc.mqttClientId,
                            clean: true,
                            protocol: mc.protocol,
                            protocolVersion: mc.protocolVersion,
                            username: mc.username,
                            password: mc.password,
                            reconnectPeriod: mc.reconnectPeriod,
                            connectTimeout: mc.connectTimeout,
                          });
  msg(1,f,NOTIFY,'Connect to MQTT broker ' + mc.url)
  mqttClient.on("error", (error) => {
    msg(1,f,ERROR,'Error connecting ',error)
  })

  onConnectPromise(messageCB)
  msg(1,f,NOTIFY,'exit')
}

const connected = () => {
  return (mqttClient && mqttClient.connected)
}

const subscribe = (topics) => {
  const f = "mqttNode::subscribe"
  msg(2,f,DEBUG, "mqtt subscribe ", mqttClient.connected)
  for (let topic in topics) {
    mqttClient.subscribe(topics[topic])
  }
  msg(3,f,DEBUG, 'mqtt subscribe exit')
}

const unsubscribe = (topics) => {
  const f = "mqttNode::unsubscribe"
  msg(2,f,DEBUG, "mqtt unsubscribe ", mqttClient.connected)
  for (let topic in topics) {
    mqttClient.unsubscribe(topics[topic])
  }
  msg(3,f,DEBUG, 'mqtt unsubscribe exit')
}

const publish = (topic, payload) => {
  const res = mqttClient.publish(topic, payload)
};

/**
 * registerTopicCB - register callbacks by topic
 * @param topic
 * @param cb
 */
const registerTopicCB = (topic, cb) => {
  const f = "mqttNode::registerTopicCB"
  // If necessary intialize new topic
//console.log(f, "Register topic", topic)
  if (!topicsCB[topic]) {
//  console.log(f, "Initialize topic", topic)
    topicsCB[topic] = [];
  }
  for (let rcb in topicsCB[topic]) {
    if (rcb === cb) {
//    console.log(f, "Already added", topic)
      return;
    }
  }
//console.log(f, "add topic", topic)
  topicsCB[topic].push(cb);
}

/**
 * registerMetricCB - register callback by metric name - Influx formatted payload
 * @param metric
 * @param cb
 */
const registerMetricCB = (metricId, cb) => {
  const f = "mqttNode::registerMetricCB"
  // If necessary intialize new metric
  const metric = global.aaa.metrics[metricId.toLowerCase()]
  if (!metric) {
    mgError(1, f,'Cannot find metric ', metricId);
    return
  }
  if (metric.cbs) {
    if (metric.cbs.includes(cb)) {
      mgWarning.log(1, f, "already registered ", metricId)
    } else {
      metric.cbs.push(cb)
    }
  } else {
    metric.cbs = [cb]
  }
}

/**
 * processInflux
 *
 * inp, out, hum - messaages all use Influx Line format.
 * This function breaks those down, finds the metric and value,
 *
 * @param topic
 * @param payloadStr
 */
const processInflux = (topic, payloadStr) => {
  const f = "mqttNode::processInflux"
  const funcId = topic.split("/")[1]
  const {tags, values} = extractFromTags(payloadStr)
  if (tags["Metric"]) {
    const metricId = tags["Metric"]
    const metric = findMetric(metricId)
    if (metric == null) {
      msg(1,f,ERROR, "Metric not found ",metricId);
    }
//  console.log(f, 'Metric found ', metricId)

    switch (funcId) {
      case 'input':
        if (!metric.input) {
          msg(0,f,WARNING, 'Metric does not have a input',metric.metricId)
        } else {
          metric.input.value = values.value
        }
        metric.value = values.value
        break;
      case 'output':
        if (!metric.output) {
          msg(0,f, WARNING, 'Metric does not have a output',metric.metricId)
        } else {
          metric.output.value = values.value
        }
        metric.value = values.value
        break;
      case 'user':
        if (!metric.user) {
          msg(0,f, WARNING, 'Metric does not have a user',metric.metricId)
        } else {
          metric.user.value = values.value
        }
        break;
      default:
        msg(0,f,ERROR, 'Unknown tags.funcId ', tags)
        return;
    }
    if (!metric.cbs) {
      msg(1,f, DEBUG, "Metric does not have any callbacks: ", metric.metricId);
      return;
    }
    for (let cb of metric.cbs) {
//    console.log(f, '  ----- execute a callback')
      cb(metric, topic, payloadStr, tags, values)
    }
  } else {
    msg(0,f, ERROR, "Could not find Metric field in influx string");
  }
}

const processCB = (_topic, _payload) => {
  const f = 'mqttNode::processCB - '
  let payloadStr = _payload.toString();
  let func = _topic.split('/')[1]
//console.log(f, 'enter ', _topic)

  try {
    if (func === 'inp' || func === 'out' || func === 'hum') {
      processInflux(_topic, payloadStr)
    }
    for (let itopic in topicsCB) {
      if (_topic.indexOf(itopic) > -1) {
        // Execute the callbacks for this topic
        for (let cb of topicsCB[itopic]) {
          cb(_topic,payloadStr)
        }
      }
    }
  } catch (err) {
    console.log(f, 'ERROR: ' + err)
  }
}

module.exports.connect =  connect
module.exports.connected = connected
module.exports.publish =  publish
module.exports.subscribe = subscribe
module.exports.unsubscribe = unsubscribe
module.exports.registerTopicCB = registerTopicCB
module.exports.registerMetricCB = registerMetricCB
module.exports.processCB = processCB