import mqtt from 'precompiled-mqtt';
import {extractFromTags} from './influxr'
import {mgDebug, mgWarning, mgError} from './mg'
import {findMetric} from './metrics'
//import {msg} from "../../../../../apps/lt/administrator/utils/msg";
import YAML from "yaml-parser";

let mqttClient;
let topicsCB = {}

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

const onConnectPromise = (connectCb, processCb) => {
  const f = "mqttReact::onConnectPromise"
  return new Promise((resolve, reject) => {
    mqttClient.on('connect', (event) => {
      global.aaa.status.mqttConnected++
      console.log(f,"connected ", mqttClient.connected)
      mqttUnsubscribe(global.aaa.topics.subscribe)
      mqttSubscribe(global.aaa.topics.subscribe)
      connectCb()
      mqttClient.on('message', processCb)
      resolve('connected')
    })
  })
}

const mqttConnect = (connectCb, processCb) => {
  topicsCB = {};
  const f = 'mqttReact::mqttConnect'
  console.log(f, 'connect to mqtt url/ip', global.aam.url)
  mqttClient = mqtt.connect(global.aam.url, {
    clientId: global.aam.mqttClientId,
    clean: true,
    protocol: global.aam.protocol,
    username: global.aam.username,
    password: global.aam.password,
    reconnectPeriod: global.aam.reconnectPeriod,
    connectTimeout: global.aam.connectTimeout,
  });
  console.log(f, 'connected it up', mqttClient.connected)

  mqttClient.on("error", (error) => {
    console.log(f, "MQTT Error - ", error)
  })

  console.log(f,'wait for the On event')
  onConnectPromise(connectCb, processCb)
  console.log(f,'we\'re on')

  /*
  mqttSubscribe(global.aaa.topics.subscribe, () => {
    console.log(f, 'subscribed', global.aaa.topics.subscribe)
  })

  mqttClient.on('message', cb);
  */
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
    global.aaa.status.mqttSubscribe++;
  }
}

const mqttUnsubscribe = (topics) => {
  const f = "mqttReact::mqttUnsubscribe - "
  console.log(f, "enter ")
  for (let name in topics) {
    console.log(f, "topic: ", topics[name])
    mqttClient.unsubscribe(topics[name]);
    global.aaa.status.mqttUnsubscribe++;
  }
}

const mqttPublish = (topic, payload) => {
  const f = "mqttReact::mqttPublish"
  if (!mqttClient.connected) {
    console.log(f, "ERROR: mqtt not connected")
  }
  const res = mqttClient.publish(topic, payload)
  return res
}

const mqttRegisterTopicCB = (_topic, cb, args) => {
  const f = "mqttReact::mqttRegisterTopicCB"
  // If necessary intialize new topic
  const topic = _topic.replace(/#/,'')
  mgDebug(2, f, "Register topic", topic)
  if (!topicsCB[topic]) {
    console.log(f, "Initialize topic", topic)
    topicsCB[topic] = [];
  }
  for (let rcb in topicsCB[topic]) {
    if (rcb === cb) {
      console.log(f, "Already added", topic)
      return;
    }
  }
  console.log(f, "add topic", topic)
  topicsCB[topic].push({args: args, cb:cb});
}

const mqttUnregisterTopicCB = (_topic, cb, args) => {
  const f = "mqttReact::mqttUnregisterTopicCB"
  const topic = _topic.replace(/#/,'')
  for (let t in topicsCB) {
    console.log(f, "   Check topic", t)
    if (t === topic) {
      console.log(f, "   Topic found", topicsCB[t].length)
      // Execute the callbacks for this topic
      for (let rcb of topicsCB[t]) {
        if (cb === rcb.cb ) {
          topicsCB[t] = topicsCB[t].filter((item) => {
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
    mgError(0, f,'Cannot find metric ', metricId);
    return
  }
  if (metric.cbs) {
    if (metric.cbs.includes(cb)) {
      mgWarning(1, f, "already registered ", metricId)
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
      mgDebug(2, f, "Parse yml file: ", filepath)
      inFile = YAML.safeLoad(inPayload);
    } else if (fileType === 'json') {
      mgDebug(2, f, "Parse json file: ", filepath)
      inFile = JSON.parse(inPayload)
    }
    if (inFile.rsp === cmd) {
      mqttUnregisterTopicCB(global.aaa.topics.register.rsp, onLoadCB)
      cb(inTopic, inFile)
    }
  }
  mqttRegisterTopicCB((global.aaa.topics.register.rsp) , onLoadCB)
  let payload = `{"cmd": "${cmd}", "clientId": "${clientId}", "filepath": "${filepath}"}`
  mqttPublish(global.aaa.topics.publish.adm, payload)
}


const mqttProcessCB = (_topic, _payload) => {
  const f = 'mqttReact::mqttProcessCB'
  let payloadStr = _payload.toString();
  console.log(f, 'enter ', _topic, payloadStr)

  try {
    const fields = _topic.split("/")
    const func = fields[2]

    // If inp out, hum - process and Metric Callbacks
    if (func === 'inp' || func === 'out' || func === 'hum') {
      const {tags, values} = extractFromTags(payloadStr)
      if (!tags["MetricId"]) {
        mgError(0, f, "Could not find Metric field in influx string");
        return;
      }
      const metricId = tags["MetricId"].toLowerCase()
      const metric = findMetric(tags["MetricId"])
      const funcId = tags["FuncId"]
//    const projectId = tags["ProjectId"]
      if (metric == null) {
        mgError(0, f, "Could not find Metric: ", metricId)
        return
      }

      if (metric.cbs) {
        switch (funcId) {
          case 'inp':
            if (!metric.input) {
              mgWarning(0, f, 'Metric does not have a input metric', metric.metricId)
              return
            }
            metric.input.value = values.value
//        metric.value = values.value
            break;
          case 'out':
            if (!metric.output) {
              mgWarning(0, f, 'Metric does not have a output metric', metric.metricId)
              return
            }
            metric.output.value = values.value
            break;
          case 'hum':
            if (!metric.hum) {
              mgWarning(0, f, 'Metric does not have a human metric', metric.metricId)
              return
            }
            metric.hum.value = values.value
            break;
          default:
            mgError(0, f, 'Unknown funcId ', funcId)
            return;
        }

        for (let cb of metric.cbs) {
          cb(metric, _topic, payloadStr, tags, values)
        }
      }
    }

    // Process any Topic Callbacks
    var payload;
    if (payloadStr[0] === '{') {
      payload = JSON.parse(payloadStr);
    }
    console.log(f, "Look for topic", _topic)
    for (let topic in topicsCB) {
      if (_topic.indexOf(topic) > -1) {
//      console.log(f, "   Topic found", topicsCB[topic].length)
        // Execute the callbacks for this topic
        for (let rec of topicsCB[topic]) {
          if (payload && rec.args) {
            var valid = true
            for (var field in rec.args) {
              if (rec.args[field] && rec.args[field] !== payload[field]) {
                valid = false
              }
            }
            if (valid) {
              try {
                if (rec.cb.current) {
                  rec.cb.current(_topic,payload)
                } else {
                  rec.cb(_topic,payload)
                }
              } catch(err) {
                console.log(f, 'ERROR in cb w/args: ' + err)
              }
            }
          } else {
            try {
              if (rec.cb.current) {
                rec.cb.current(_topic,payloadStr)
              } else {
                rec.cb(_topic,payloadStr)
              }
            } catch(err) {
              console.log(f, 'ERROR in cb: ' + err)
            }
          }
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
