import mqtt from 'precompiled-mqtt';
import {extractFromTags} from './influxr'
import {mgDebug, mgWarning, mgError} from './mg'
import {findMetric} from './metrics'

let mqttClient;
let topicCB = {}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const onConnectPromise = (cb) => {
  const f = "mqttReact::onConnectPromise"
  return new Promise((resolve, reject) => {
    mqttClient.on('connect', (event) => {
      console.log(f,"connected ", mqttClient.connected)
//    mqttClient.unsubscribe(Object.values(global.aaa.topics.subscribe, () => { 500}))
      mqttSubscribe(global.aaa.topics.subscribe, () => {
        console.log(f, 'subscribed', global.aaa.topics.subscribe)
        mqttClient.on('message', cb);
      })
      resolve('connected')
    })
  })
}

const mqttConnect = (cb) => {
  topicCB = {};
  const f = 'mqttReact::mqttConnect'
  console.log(f, 'connect it up', global.aaa.mqtt.connectUrl)
  mqttClient = mqtt.connect(global.aaa.mqtt.connectUrl, {
//  clientId: global.aaa.mqtt.clientId,
    clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
    clean: true,
    protocolId: 'MQTT',
    username: global.aaa.mqtt.username,
    password: global.aaa.mqtt.password,
    reconnectPeriod: global.aaa.mqtt.reconnectPeriod,
    connectTimeout: global.aaa.mqtt.connectTimeout,
  });
  console.log(f, 'connected it up', mqttClient.connected)

  mqttClient.on("error", (error) => {
    console.log(f, "MQTT Error - ", error)
  })

  console.log(f,'wait for the On event')
  onConnectPromise(cb)
  console.log(f,'we\'re on')

  mqttSubscribe(global.aaa.topics.subscribe, () => {
    console.log(f, 'subscribed', global.aaa.topics.subscribe)
  })

  mqttClient.on('message', cb);
  console.log(f,'exit')
}

const mqttConnected = () => {
  return (mqttClient && mqttClient.connected)
}

const mqttSubscribe = (topics) => {
  const f = "mqttReact::mqttSubscribe - "
  console.log(f, "enter ")
  for (let name in topics) {
    console.log(f, "topic: ", topics[name])
    mqttClient.subscribe(topics[name])
  }
}

const mqttUnsubscribe = (topics) => {
  const f = "mqttReact::mqttSubscribe - "
  console.log(f, "enter ")
  for (let name in topics) {
    console.log(f, "topic: ", topics[name])
    mqttClient.unsubscribe(topics[name]);
  }
}

const mqttPublish = (topic, payload) => {
  const f = "mqttReact::mqttPublish"
  if (!mqttClient.connected) {
    console.log(f, "ERROR: mqtt not connected")
  }
  const res = mqttClient.publish(topic, payload, {qos: 0, retain: false})
  return res
}

const mqttRegisterTopicCB = (_topic, cb) => {
  const f = "mqttReact::mqttRegisterTopicCB"
  // If necessary intialize new topic
  const topic = _topic.replace(/\#/,'')
  mgDebug(f, "Register topic", topic)
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

const mqttUnregisterTopicCB = (topic, cb) => {
  const f = "mqttReact::mqttUnregisterTopicCB"
  for (let itopic in topicCB) {
    console.log(f, "   Check topic", itopic)
    if (topic === itopic) {
      console.log(f, "   Topic found", topicCB[itopic].length)
      // Execute the callbacks for this topic
      for (let rcb of topicCB[itopic]) {
        if (cb === rcb ) {
          topicCB[itopic].filter((item) => {return !item === cb} )
          break
        }
      }
    }
  }
}

const mqttRegisterMetricCB = (_metricId, cb) => {
  const f = "mqttReact::mqttRegisterMetricCB"
  console.log(f, 'enter')
  // If necessary intialize new metric
  const metricId = _metricId.toLowerCase()
  const metric = global.aaa.metrics[metricId]
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

const mqttUnregisterMetricCB = (metric, cb) => {
}

const mqttReqFile = (name, path, cb) => {
  let pubTopic = `${global.aaa.projectId}/admin/fileReq/${global.aaa.clientId}`
  let subTopic = `${global.aaa.projectId}/admin/file/${global.aaa.clientId}`

  const onLoadCB = (inTopic, inJson) => {
    const inPayload = JSON.parse(inJson);
    if (inPayload.name === name) {
      cb(inTopic, inPayload)
      mqttUnregisterTopicCB(subTopic, onLoadCB)
    }
  }
  mqttRegisterTopicCB(subTopic, onLoadCB)
  let payload = `{"path": "${path}"}`
  mqttPublish(pubTopic, payload)
}


const processInflux = (topic, payloadStr) => {
  const f = "mqttReact::processInflux"
  const msgType = topic.split("/")[1]
  const {tags, values} = extractFromTags(payloadStr)
  if (!tags["Metric"]) {
    mgError(f, "Could not find Metric field in influx string");
    return;
  } else {
    const metric = findMetric(tags["Metric"])
    if (metric == null) return;
    console.log(f, 'Metric found ', metric)

    switch (msgType) {
      case 'input':
        if (!metric.input) {
          mgWarning(f,'Metric does not have a input',metric.metricId)
        } else {
          metric.input.value = values.value
        }
        metric.value = values.value
        break;

      case 'output':
        if (!metric.output) {
//        mgWarning(f,'Metric does not have a output',metric.metricId)
        } else {
          metric.output.value = values.value
        }
        metric.value = values.value
        break;
      case 'user':
        if (!metric.user) {
          mgWarning(f,'Metric does not have a user',metric.metricId)
        } else {
          metric.user.value = values.value
        }
        break;
      default:
        mgError(f,'Unknown tags.msgType ', tags)
        return;
    }
    if (!metric.cbs) {
//    mgDebug(f, "Metric does not have any registered Callbacks: ", metric.metricId);
    } else {
      for (let cb of metric.cbs) {
        cb(metric, topic, payloadStr, tags, values)
      }
    }
  }
}

const mqttProcessCB = (topic, payload) => {
  const f = 'mqttReact::mqttProcessCB'
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic, payloadStr)

  try {
    // If this is a metricCB - influx line buf - call metric callbacks
    if (topic.indexOf("/influx/") > -1) {
      processInflux(topic, payloadStr)
    }

//  console.log(f, "Look for topic", topic)
    for (let itopic in topicCB) {
      if (topic.indexOf(itopic) > -1) {
//      console.log(f, "   Topic found", topicCB[itopic].length)
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

export {
  mqttConnect,
  mqttConnected,
  mqttPublish,
  mqttSubscribe,
  mqttUnsubscribe,
  mqttRegisterMetricCB,
  mqttUnregisterMetricCB,
  mqttRegisterTopicCB,
  mqttUnregisterTopicCB,
  mqttProcessCB,
  mqttReqFile,
}