import mqtt from 'precompiled-mqtt';
import {extractFromTags} from './influxr'
import {mgDebug, mgWarning, mgError} from './mg'
import {findMetric} from './metrics'
//import {msg} from "../../../../../apps/lt/administrator/utils/msg";
import YAML from "yaml-parser";

let mqttClient;
let topicCB = {}

/**
 * sleep() - synchronous sleep function
 */

/*
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
*/

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
  const topic = _topic.replace(/#/,'')
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

const mqttUnregisterTopicCB = (_topic, cb) => {
  const f = "mqttReact::mqttUnregisterTopicCB"
  const topic = _topic.replace(/#/,'')
  for (let t in topicCB) {
    console.log(f, "   Check topic", t)
    if (t === topic) {
      console.log(f, "   Topic found", topicCB[t].length)
      // Execute the callbacks for this topic
      for (let rcb of topicCB[t]) {
        if (cb === rcb ) {
          topicCB[t] = topicCB[t].filter((item) => {
            return item.name !== cb.name
          })
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

const mqttRequestFile = (clientId, name, filepath, fileType, cb) => {
  const f = "mqttReact::mqttRequestFile"
  const cmd = (fileType === 'yml') ? "requestYmlFile" : "requestJsonFile"
  const onLoadCB = (inTopic, inPayload) => {
    var inFile = {}
    if (fileType === 'yml') {
      mgDebug(f, "Parse yml file: ", filepath)
      inFile = YAML.safeLoad(inPayload);
    } else if (fileType === 'json') {
      mgDebug(f, "Parse json file: ", filepath)
      inFile = JSON.parse(inPayload)
    }
    if (inFile.cmd === cmd) {
      mqttUnregisterTopicCB(global.aaa.topics.subscribe.rsp, onLoadCB)
      cb(inTopic, inFile)
    }
  }
  mqttRegisterTopicCB(global.aaa.topics.subscribe.rsp, onLoadCB)
  let payload = `{"cmd": "${cmd}", "clientId": "${clientId}", "filepath": "${filepath}"}`
  mqttPublish(global.aaa.topics.publish.adm, payload)
}


const mqttProcessCB = (topic, payload) => {
  const f = 'mqttReact::mqttProcessCB'
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic, payloadStr)

  try {
    // If this is a metricCB - influx line buf - call metric callbacks
    const fields = topic.split("/")
    const func = fields[1]
    if (func === 'inp' || func === 'out' || func === 'hum') {
      const {tags, values} = extractFromTags(payloadStr)
      if (!tags["MetricId"]) {
        mgError(f, "Could not find Metric field in influx string");
        return;
      }
      const metricId = tags["MetricId"].toLowerCase()
      const metric = findMetric(tags["MetricId"])
      const sourceId = tags["Source"]
      const projectId = tags["ProjectId"]
      if (metric == null) {
        mgError(f, "Could not find Metric: ", metricId)
        return
      }

      if (metric.cbs) {
        switch (sourceId) {
          case 'I':
            if (!metric.input) {
              mgWarning(f, 'Metric does not have a input', metric.metricId)
              return
            }
            metric.input.value = values.value
//        metric.value = values.value
            break;

          case 'O':
            if (!metric.output) {
              mgWarning(f, 'Metric does not have a output', metric.metricId)
              return
            }
            metric.output.value = values.value
            break;
          case 'H':
            if (!metric.user) {
              mgWarning(f, 'Metric does not have a user', metric.metricId)
              return
            }
            metric.human.value = values.value
            break;
          default:
            mgError(f, 'Unknown sourceId ', sourceId)
            return;
        }

        for (let cb of metric.cbs) {
          cb(metric, topic, payloadStr, tags, values)
        }
      }
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
  mqttRequestFile,
}