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
let topicCB = {}

/**
 * connect - connect to the MQTT broker, set callback, subscribe to topics
 * @param cb
 */
const connect = (clientId, messageCB) => {
  const f = 'mqttNode:connect'
//msg(3,f,DEBUG, 'enter')
  const mc = global.aaa.mqtt;
  topicCB ={};

  const onConnectPromise = (messageCB) => {
    const f = "mqttNode::onConnectPromise"
    return new Promise((resolve, reject) => {
      mqttClient.on('connect', (event) => {
        msg(1,f,NOTIFY,'Connected to MQTT broker ' + mc.url)
        mqttClient.unsubscribe((Object.values(global.aaa.topics.subscribe)), () => {})
        mqttClient.subscribe(Object.values(global.aaa.topics.subscribe), () => {
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
                            clientId: `${clientId}_${Math.random().toString(16).slice(3)}`,
                            clean: true,
                            protocol: 'MQTT',
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
  const res = mqttClient.publish(topic, payload, {qos: 0, retain: false})
};

/**
 * registerTopicCB - register callbacks by topic
 * @param topic
 * @param cb
 */
const registerTopicCB = (topic, cb) => {
  const f = "mqttNode::registerTopicCB"
  // If necessary intialize new topic
  console.log(f, "Register topic", topic)
  if (!topicCB[topic]) {
    console.log(f, "Initialize topic", topic)
    topicCB[topic] = [];
  }
  for (let rcb in topicCB[topic]) {
    if (rcb === cb) {
      console.log(f, "Already added", topic)
      return;
    }
  }
  console.log(f, "add topic", topic)
  topicCB[topic].push(cb);
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
    mgError(f,'Cannot find metric ', metricId);
    return
  }
  if (metric.cbs) {
    if (metric.cbs.includes(cb)) {
      mgWarning.log(f, "already registered ", metricId)
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
 * Input, output, and user messaage all use Influx Line format.
 * This function breaks those down, finds the metric and value,
 * and acts accordingly.
 *
 * Outputs result in controlling a channel on the Edge device.
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
    console.log(f, 'Metric found ', metricId)

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

const processCB = (topic, payload) => {
  const f = 'mqttNode::processCB - '
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic)

  try {
    if (topic.indexOf("/influx/") > -1) {
      processInflux(topic, payloadStr)
    }
    for (let itopic in topicCB) {
      if (topic.indexOf(itopic) > -1) {
        // Execute the callbacks for this topic
        for (let cb of topicCB[itopic]) {
          cb(topic,payloadStr)
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
