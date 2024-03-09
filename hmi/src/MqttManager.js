// File: MqttManager.js

// publishStatus
// cmdCB - not used
// loadConfigCB - loads configuration -

import {useState, useEffect, useCallback} from 'react';
import {mgDebug, mgError} from './utils/mg'
import {ckTopic} from './utils/topics'

import {mqttConnect,
        mqttPublish,
        mqttProcessCB,
        mqttSubscribe,
        mqttUnsubscribe,
        mqttRegisterTopicCB,
//      mqttUnregisterTopicCB
       } from './utils/mqttReact.js';

import "./MqttManager.scss"

//import seedrandom from 'seedrandom'
//const generator = seedrandom(Date.now())

function MqttManager (props) {
  const [connected, setConnected] = useState(false)
  const [haveConfig, setHaveConfig] = useState(false)

  const cmdCB = useCallback((_topic, _payload) => {
//  const f = "index:processCB"
    var out
    var topic = global.aaa.topics.publish.rsp
    var payload = JSON.parse(_payload)
    if (payload.clientId === global.aaa.clientId || payload.clientId === 'all') {
      if (payload.cmd === 'requestStatus') {
        out = JSON.stringify(publishStatus())
      }
      if (payload.cmd === 'setDebugLevel') {
        global.aaa.status.debugLevel = payload.debugLevel
        out = JSON.stringify({
          rsp: 'setDebugLevel',
          clientId: global.aaa.clientId,
          debugLevel: global.aaa.status.debugLevel,
        })
      }
    }
    if (out) {
      mqttPublish(topic, out)
    }
  }, [])

  const loadConfigCB = useCallback((_topic, _payload) => {
    const f = "MqttManager::loadConfigCB - "
//  mgDebug(0,f, 'enter ',_payload.cmd, _topic)

    // Ignore all responses that aren't requestConfig and this clientId
    if (_payload.rsp !== "requestConfig") return
    if (_payload.mqttClientId !== global.aaa.mqttClientId) return;
//  if (_payload.clientId !== global.aaa.clientId) return

    if (haveConfig) {
      console.log(f + ' haveConfig --- exit')
      return;  // Ensure configuration is loaded once.
    }
    setHaveConfig(true);

    mqttUnsubscribe(global.aaa.topics.subscribe);
//  mqttUnregisterTopicCB(ckTopic("register","rsp"), loadConfigCB,{})

    mgDebug(1,f, 'try')

    try {
      // Replace global.aaa object with new configuration
      _payload.startTime = global.aaa.startTime
      _payload.status = global.aaa.status
      _payload.userId = global.aaa.userId
      if (_payload.metrics === "project") {
        _payload.metrics = {}
      }
      global.aaa = _payload

      mgDebug(1,f, 'call mqttSubscribe ', _topic)
      mqttSubscribe(global.aaa.topics.subscribe, )
      mqttRegisterTopicCB(ckTopic("register","cmd"),cmdCB)

      // Create full list of inp and out by combining them from all clients -- is this used?
      global.aaa.inp = {}
      global.aaa.out = {}
      for (var clientId in global.aaa.clients) {
        if (clientId !== "administrator") {
          const client = global.aaa.clients[clientId]
          if (!client) {
            console.log('MqttClient not found ' + clientId);
            continue;
          }
          for (let inputName in client.inp) {
            const input = client.inp[inputName]
            global.aaa.inp[inputName.toLowerCase()] = input;
          }
          for (let outputName in client.out) {
            const output = client.out[outputName]
            global.aaa.out[outputName.toLowerCase()] = output;
          }
        }
      }
    } catch(err) {
      mgError(0,f, 'Error: ' + err)
    }
  }, [haveConfig, cmdCB])

  const connectCB = useCallback(() => {
    const f = "MqttManager::connectCB - "
    mgDebug(1,f, 'enter')
    setConnected(true)
    if (global.aaa.status.mqttConnected > 1) return;

    mqttUnsubscribe(global.aaa.topics.subscribe);
    mqttSubscribe(global.aaa.topics.subscribe);
    mqttRegisterTopicCB(ckTopic("register","rsp"), loadConfigCB,{})

    // Request Config
    const payloadStr = `{"cmd": "requestConfig", "mqttClientId": "${global.aaa.mqttClientId}", "type": "${props.type}", "clientId": "${global.aaa.clientId}", "projectId": "${props.projectId}"}`
    mqttPublish(ckTopic("publish","adm"), payloadStr)
  }, [props.projectId, props.type, loadConfigCB])

useEffect(() => {
//  const mqttClientId = `${global.aaa.clientId}_${generator().toString(16).slice(3,7)}`

    global.aaa.clientId = props.clientId
    global.aaa.topics = {
      subscribe: {
        adm: `a/rsp/${props.clientId}`,
      },
      register: {
        rsp: `a/rsp/${props.clientId}`,
      },
      publish: {
        adm: 'a/cmd/administrator'
      }
    }

// MQTT configuration
    global.aam = {
      url: `mqtt://${props.url}`,
      username: props.username,
      password: props.password,
      mqttClientId: global.aaa.mqttClientId,
      protocol: 'MQTT',
      protocolVersion: 4,
      connectTimeout: 10000,
      reconnectPeriod: 30000,
      keepAlive: 60,
      keepalive: 60,
    }
    mqttConnect(connectCB, mqttProcessCB);
// }, [props.password, props.url, props.username, props.clientId,connectCB])
}, [])

const publishStatus = () => {
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

    return {
      rsp: "requestStatus",
      clientId: global.aaa.clientId,
      userId: global.aaa.userId,
      mqttClientId: global.aaa.mqttClientId,
      mqttConnected: global.aaa.status.mqttConnected,
      mqttSubscribe: global.aaa.status.mqttSubscribe,
      mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
      debugLevel: global.aaa.status.debugLevel,
      uptime: uptime,
    }
  }

  return (
    <div>
      {connected && haveConfig ? (
        props.children
      ) : connected && !haveConfig ? (
        <p className="loading">Loading configuration.....</p>
      ) : !connected && haveConfig ? (
        <p className="loading">This should not happen - not connected to MQTT and configuration is loaded?</p>
      ) : (
        <p className="loading">Connecting to MQTT Broker {props.host}......</p>
      )}
    </div>
  )
}

export default MqttManager;
