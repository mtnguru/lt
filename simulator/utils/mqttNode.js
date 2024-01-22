/**
 * File mqttNode.js
 */

require('./msgE')
const {msg, msgn, setDebugLevel} = require('../utils/msg.js')
const mqtt = require('mqtt');
const {extractFromTags} = require('./influx')
const {findMetric} = require('./metrics')
// require('dotenv').config();

let mqttClient;
let topicsCB = {}

const connectPromise = (connectCB, messageCB) => {
  const f = 'mqttNode:connectPromise'
  const mc = global.aam;
  topicsCB = {};

  return new Promise((resolve, reject) => {
    msg(1, f, NOTIFY, 'Execute connect to MQTT broker ' + mc.url)
    mqttClient = mqtt.connect((mc.ip) ? mc.ip : mc.url, {
      clientId: mc.mqttClientId,
      protocol: mc.protocol,
      protocolVersion: mc.protocolVersion,
      username: mc.username,
      password: mc.password,
      reconnectPeriod: mc.reconnectPeriod,
      connectTimeout: mc.connectTimeout,
      keepAlive: mc.keepAlive,
    });

    mqttClient.on('connect', (event) => {
      msg(1, f, NOTIFY, 'Connected to MQTT broker ' + mc.url)
      global.aaa.status.mqttConnected++;
      if (global.aaa.status.mqttConnected === 1) {
        subscribe(global.aaa.topics.subscribe);
      }
      connectCB();
      resolve('connected')
    })

    mqttClient.on('message', (inTopic, payloadRaw) => {
      msg(3, f, NOTIFY, 'MQTT message received ', inTopic)
      messageCB(inTopic, payloadRaw)
    })

    mqttClient.on('reconnect', (msg) => {
//    unsubscribe(global.aaa.topics.subscribe);
      console.error('on mqtt reconnect -', msg);
    });

    mqttClient.on('offline', (msg) => {
      console.error('on mqtt offline -', msg);
    });

    mqttClient.on('end', (msg) => {
      console.log('on mqtt end -', msg);
    });

    mqttClient.on('close', (msg) => {
      console.log('on mqtt close -', msg);
      setTimeout(() => {
        mqttClient.reconnect();
      }, 1000); // Wait for 1 second before trying to reconnect
    });

    mqttClient.on('error', (err) => {
      console.log('Connection error -', err);
      mqttClient.end();
      reject(err);
    });

    process.on('SIGINT', (msg) => {
      console.log('SIGINT received -', msg);
      mqttClient.end();
      process.exit();
    })
  })
}

/**
 * connect - connect to the MQTT broker, set callback, subscribe to topics
 * @param cb
 */
const connect = (connectCB, messageCB) => {
  const f = 'mqttNode:connect'
  connectPromise(connectCB, messageCB)
    .then((status) => {
      console.log('MQTT client -', status);
    })
    .catch((error) => {
      console.error('MQTT client NOT connected -',error);
    })
  msg(1,f,NOTIFY,'exit')
}

const connected = () => {
  return (mqttClient && mqttClient.connected)
}

const subscribe = (topics) => {
  const f = "mqttNode::subscribe"
  msg(2,f,DEBUG, "mqtt subscribe ", mqttClient.connected)
  for (let name in topics) {
    var topic = topics[name]
    mqttClient.subscribe(topic, function (err) {
      if (!err) {
        msg(1, f,NOTIFY, `Subscribed: ${topic}`);
      } else {
        msg(1, f, ERROR, `Subscribe failed: ${topic}`);
      }
    });
    global.aaa.status.mqttSubscribe++;
  }
  msg(3,f,DEBUG, 'mqtt subscribe exit')
}

const unsubscribe = (topics) => {
  const f = "mqttNode::unsubscribe"
  msg(2,f,DEBUG, "mqtt unsubscribe ", mqttClient.connected)
  for (let name in topics) {
    var topic = topics[name]
    mqttClient.unsubscribe(topic, function (err) {
      if (!err) {
        msg(1,f,NOTIFY,`Unsubscribed: ${topic}`);
      } else {
        msg(1,f, ERROR, `Unsubscribed failed: ${topic}`);
      }
    });
    global.aaa.status.mqttUnsubscribe++;
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
  if (!topicsCB[topic]) {
    topicsCB[topic] = [];
  }
  for (let rcb in topicsCB[topic]) {
    if (rcb === cb) {
      return;
    }
  }
  topicsCB[topic].push(cb);
}

/**
 * registerMetricCB - register callback by metric name - Influx formatted payload
 * @param metric
 * @param cb
 */
const registerMetricCB = (metricId, cb, func) => {
  const f = "mqttNode::registerMetricCB"
  // If necessary intialize new metric
  try {
    const id = metricId.toLowerCase()
    var metric;
    switch (func) {
      case 'inp': metric = global.aaa.inp[id]; break;
      case 'out': metric = global.aaa.out[id]; break;
      case 'hum': metric = global.aaa.hum[id]; break;
    }
    if (!metric) {
      msg(1,f,ERROR,'Cannot find metric ', id);
      return
    }
    if (metric.cbs) {
      if (metric.cbs.includes(cb)) {
        msg(1,f,WARNING, "already registered ", id)
      } else {
        metric.cbs.push(cb)
      }
    } else {
      metric.cbs = [cb]
    }
  } catch(err){
    msg(0,f,ERROR, "Cannot register metric",metricId);
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
  const sourceId = topic.split("/")[2]
  const {tags, values} = extractFromTags(payloadStr)
  if (tags["Metric"]) {
    const metricId = tags["Metric"]
    const metric = findMetric(metricId)
    if (metric == null) {
      msg(1,f,ERROR, "Metric not found ",metricId);
    }
//  console.log(f, 'Metric found ', metricId)

    switch (sourceId) {
      case 'inp':
        if (!metric.inp) {
          msg(0,f,WARNING,  'Metric does not have an inp metric',metric.metricId)
        } else {
          metric.inp.value = values.value
        }
        metric.value = values.value
        break;
      case 'out':
        if (!metric.out) {
          msg(0,f, WARNING, 'Metric does not have an out metric',metric.metricId)
        } else {
          metric.out.value = values.value
        }
        metric.value = values.value
        break;
      case 'hum':
        if (!metric.hum) {
          msg(0,f, WARNING, 'Metric does not have an hum metric',metric.metricId)
        } else {
          metric.hum.value = values.value
        }
        break;
      default:
        msg(0,f,ERROR, 'Unknown tags.sourceId ', tags)
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
  let func = _topic.split('/')[2]
//console.log(f, 'enter ', _topic)

  try {
    if (func === 'inp' ||
        func === 'out' ||
        func === 'hum' ||
        func === 'upper' ||
        func === 'lower' ||
        func === 'high' ||
        func === 'low') {
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
    console.log(f, 'ERROR: Error processing ' + _topic + '  '  + err)
    msg(0,f, ERROR, "Error processing:", _topic, "Error", err);
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