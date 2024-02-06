import mqtt from 'precompiled-mqtt';
//import mqtt from 'mqtt';
//import {Buffer} from 'buffer';
import {extractFromTags} from './influxr'
import {mgNotify, mgDebug, mgWarning, mgError} from './mg'
import {findMetric} from './metrics'
import {ckTopic} from './topics'
//import {msg} from "../../../../../apps/lt/administrator/utils/msg";
import YAML from "yaml-parser";

var mqttClient
var mqttStatusCB
var topicsCB = {}

window.Buffer = window.Buffer || require("buffer").Buffer;
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

const connectToBroker = (connectCB, messageCB) => {
  const f = 'mqttNode:connectToBroker'
  const mc = global.aam;

  return new Promise((resolve, reject) => {
    if (mqttStatusCB) {
      mqttStatusCB('connect')
    }
    mqttClient = mqtt.connect((mc.ip) ? mc.ip : mc.url, {
      clientId: mc.mqttClientId,
      clean: false,
      protocol: mc.protocol,
      protocolVersion: mc.protocolVersion,
      username: mc.username,
      password: mc.password,
      reconnectPeriod: mc.reconnectPeriod,
      connectTimeout: mc.connectTimeout,
      keepAlive: mc.keepAlive,
    });

    console.log(f, "Connect to MQTT broker " + mc.url)
    mqttClient.on('connect', (event) => {
      if (mqttStatusCB) {
        mqttStatusCB('connected')
      }
      global.aaa.status.mqttConnected++;
      console.log(f, "MQTT on connect ")
      connectCB();

      if (global.aaa.status.mqttConnected === 1) {
        resolve('connected')
      }
    })

    mqttClient.on('error', (msg) => {
      if (mqttStatusCB) {
        mqttStatusCB('close')
      }
      mgError(0, f, "MQTT on error " + msg)
      mqttClient.end();
      reject(msg);
    });
  })
}

/**
 * mqttConnect - connect to the MQTT broker, set callback, subscribe to topics
 * @param cb
 */
const mqttConnect = (connectCB, messageCB) => {
  const f = 'mqttReact:mqttConnect'
  connectToBroker(connectCB, messageCB)
    .then((status) => {
      mgDebug(2, f, "MqttClientConnected")
    })
    .catch((error) => {
      mgError(0, f, "MQTT client NOT connected",error)
    })

  mqttClient.on('message', (inTopic, payloadRaw) => {
    if (mqttStatusCB) {
      mqttStatusCB('message')
    }
    mgNotify(1, f, "Message received " + inTopic + " -- " + payloadRaw)
    messageCB(inTopic, payloadRaw)
  })

  mqttClient.on('reconnect', () => {
    if (mqttStatusCB) {
      mqttStatusCB('reconnect')
    }
//    mqttUnsubscribe(global.aaa.topics.subscribe);
//    mgNotify(0, f, "MQTT Reconnect ")
    console.log(f, "MQTT on reconnect ")
  });

  mqttClient.on('offline', () => {
    if (mqttStatusCB) {
      mqttStatusCB('offline')
    }
//    mgWarning(0, f, "MQTT offline ")
    console.log(f, "MQTT on offline ")
  });

  mqttClient.on('end', () => {
    if (mqttStatusCB) {
      mqttStatusCB('end')
    }
//    mgWarning(0, f, "MQTT end")
    console.log(f, "MQTT on end ")
  });

  mqttClient.on('close', () => {
    if (mqttStatusCB) {
      mqttStatusCB('close')
    }
    console.log(f, "MQTT on close ")
//    mgWarning(0, f, "MQTT close")
    setTimeout(() => {
      if (!mqttClient.connected) {
        console.log(f, "MQTT call reconnect ")
        mqttClient.reconnect();
      }
    }, 10); // Wait for 1 second before trying to reconnect
  });
  mgDebug(2, f, "exit")
}

const mqttConnected = () => {
  return (mqttClient && mqttClient.connected)
}

const mqttSubscribe = (topics) => {
  const f = "mqttReact::mqttSubscribe - "
  for (let name in topics) {
    const topic = topics[name]
    mqttClient.subscribe(topic, function (err) {
      if (!err) {
        mgNotify(1,f,'Subscribed:',topic);
      } else {
        mgError(1,f,'Subscribe failed:',topic);
      }
    });
    global.aaa.status.mqttSubscribe++;
  }
}

const mqttUnsubscribe = (topics) => {
  const f = "mqttReact::mqttUnsubscribe - "
  for (let name in topics) {
    const topic = topics[name]
    mqttClient.unsubscribe(topic, function (err) {
      if (!err) {
        mgNotify(1,f,`Unsubscribed: ${topic}`);
      } else {
        mgError(1,f,`Unsubscribed failed: ${topic}`);
      }
    });
    global.aaa.status.mqttUnsubscribe++;
  }
}

const mqttPublish = (_topic, _payload) => {
  const f = "mqttReact::mqttPublish"
  if (!_topic || !_payload) return;
  if (!mqttClient.connected) {
    console.log(f, "ERROR: mqtt not connected")
  }
  const res = mqttClient.publish(_topic, _payload)
  return res
}

const mqttRegisterTopicCB = (_topic, cb, args) => {
  const f = "mqttReact::mqttRegisterTopicCB"
  // If necessary intialize new topic
  if (!_topic) {
    console.log(f, "Topic not defined")
    return
  }
  const topic = _topic.replace(/#/,'')
  mgDebug(2, f, "Register topic", topic)
  if (!topicsCB[topic]) {
    console.log(f, "Initialize topic", topic)
    topicsCB[topic] = [];
  }
  for (let t in topicsCB[topic]) {
    var tcb = topicsCB[topic][t]
    if (tcb.cb === cb) {
      var matched = true;
      for (var a in tcb.args) {
        for (var a2 in args) {
          if (a !== a2) {
            matched = false;
            continue;
          }
        }
      }
      if (matched) {
        console.log(f, "Already added", topic)
        return;
      }
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
  var metricId = _metricId.toLowerCase()
  const metric = global.aaa.metrics[metricId]
  if (!metric) {
    mgError(0, f,'Cannot find metric ', _metricId);
    return
  }
  if (metric.cbs) {
    if (metric.cbs.includes(cb)) {
      mgWarning(1, f, "already registered ", _metricId)
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
      mqttUnregisterTopicCB(ckTopic("register","rsp"), onLoadCB)
      cb(inTopic, inFile)
    }
  }
  mqttRegisterTopicCB((ckTopic("register","rsp")) , onLoadCB)
  let payload = `{"cmd": "${cmd}", "clientId": "${clientId}", "filepath": "${filepath}"}`
  mqttPublish(ckTopic("publish","adm"), payload)
}


const mqttProcessCB = (_topic, _payload) => {
  const f = 'mqttReact::mqttProcessCB'
  let payloadStr = _payload.toString();
  mgNotify(1, f, "enter", _topic, payloadStr);

  try {
    const fields = _topic.split("/")
    const func = fields[1]

    // Metric Callbacks
    // If inp, out, hum

    if (func === 'inp' ||
        func === 'out' ||
        func === 'hum' ||
        func === 'upper' ||
        func === 'lower' ||
        func === 'high' ||
        func === 'low') {
      const {tags, values} = extractFromTags(payloadStr)
      if (!tags["MetricId"]) {
        mgError(0, f, "Could not find Metric field in influx string");
        return;
      }
      const metricId = tags["MetricId"].toLowerCase()
      var metric = findMetric(tags["MetricId"])
      if (!metric) {
        metric = {
          metricId,
        }
        global.aaa.metrics[metricId] = metric
      }

      const sourceId = tags["SourceId"]
      var v = metric[sourceId]
      if (!v) {
        v = metric[sourceId] = {
          val: -999,
          date: Date.now()
        }
      }

      v.val = values.value
      if (metric.cbs) {
        for (let cb of metric.cbs) {
          cb(metric, _topic, payloadStr, tags, values)
        }
      }
    }

    // Topic Callbacks

    var payload;
    if (payloadStr[0] === '{') {
      payload = JSON.parse(payloadStr);
    }
    for (let topic in topicsCB) {
//    var ind = _topic.indexOf(topic)
//    console.log('index ' + ind)
      if (topic === "all" || (_topic.indexOf(topic) === 0)) {
//      console.log(f, "   Topic found", topicsCB[topic].length)

        // Execute the callbacks for this topic
        for (let rec of topicsCB[topic]) {
          // Filter based on rec.args
          if (payload && rec.args) {
            var valid = true
            for (var field in rec.args) {
              if (payload[field]) {
                if (payload[field] === "all") {
                  continue;
                }
                if (rec.args[field] !== payload[field]) {
                  valid = false
                }
              }
            }
            if (valid) {
              // Execute the callbacks
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
          } else { // no filter
            // Execute the callbacks
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

const mqttRegisterMqttStatusCB = (cb) => {
  mqttStatusCB = cb
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
  mqttRegisterMqttStatusCB,
  mqttProcessCB,
  mqttRequestFile,
}