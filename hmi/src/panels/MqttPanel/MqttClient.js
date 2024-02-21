import React, {useState, useEffect, useCallback} from 'react'
//import '../../chakra.scss'
import {ckTopic} from '../../utils/topics'
import { mqttRegisterTopicCB } from '../../utils/mqttReact'

import { Box, Select, Button, Tooltip } from '@chakra-ui/react'

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"

import './MqttClient.scss'

function MqttClient (props) {
  const clientId = props.client.clientId;
  const [running, setRunning] = useState('unknown')
  const [numRunning, setNumRunning] = useState(clientId === 'all' ? 'S' : 0)
  const [enabled, setEnabled] = useState(
    (global.aaa.clients[clientId].status) ? global.aaa.clients[clientId].status.enabled : 1)
  const [debugLevel, setDebugLevel] = useState(
    (global.aaa.clients[clientId].status) ? global.aaa.clients[clientId].status.debugLevel : 0)


  const rspCB = useCallback((_topic, _payload) => {
    if (_payload.clientId !== clientId) return;
    if (_payload.rsp === "setEnabled") {
      setEnabled(_payload.enabled)
    } else if (_payload.rsp === 'setDebugLevel') {
      setDebugLevel(_payload.debugLevel)
    } else if (_payload.rsp === 'requestStatus') {
      if (clientId !== 'all') {
        setRunning('running')
      }
      setNumRunning(prevNumRunning => {
        return prevNumRunning + 1
      })
    }
  }, [clientId])

  const cmdCB = useCallback((_topic, _payload) => {
    if (clientId === 'all') return;
    if (_payload.cmd === 'requestStatus' &&
        (_payload.clientId === 'all' || _payload.clientId === clientId)) {
      setRunning('stopped')   // Set status on all clients to 'stopped'
      setNumRunning(0)
    }
  }, [clientId] )

//const rspCBRef = useRef(rspCB)
//const cmdCBRef = useRef(cmdCB)

  useEffect(() => {
    console.log("MqttClient::useEffect register callbacks " + clientId)
    mqttRegisterTopicCB(ckTopic("register","rsp"), rspCB, { clientId: clientId });
    mqttRegisterTopicCB(ckTopic("register","cmd"), cmdCB, { clientId: clientId });
  }, [clientId, rspCB, cmdCB])

  const onSelectH = (event) => {
    let topic = `a/cmd/${props.client.clientId}`
    let payload = `{"cmd": "setDebugLevel", "clientId": "${clientId}", "debugLevel": ${event.target.value}}`;
    console.log('   send ', topic, payload)
    mqttPublish(topic, payload)
  }

  const onClickH = (event) => {
    const f = "Button::clickH"
    const classList = event.target.classList;
    const name = event.target.name;
    mgDebug(1, f, 'Button pressed', name)
    let topic;
    let payload;
    if (classList.contains('reset')) {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestReset", "clientId": "${props.client.clientId}"}`;
    } else if (classList.contains("status")) {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestStatus", "clientId": "${props.client.clientId}"}`;
      if (clientId === 'all') {
      }
    } else if (classList.contains("findOneWireDevices")) {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "findOneWireDevices", "clientId": "${props.client.clientId}"}`;
    } else if (classList.contains("read-inputs")) {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "readInputs", "clientId": "${props.client.clientId}"}`;
    } else if (classList.contains("enabled")) {
      // Set the "all" button on other hmi instances
      // Set the enabled button
      topic = `a/cmd/${props.client.clientId}`
      if (enabled) {
        payload = `{"cmd": "setEnabled", "enabled": 0, "clientId": "${props.client.clientId}"}`;
        setEnabled(0)
      } else {
        payload = `{"cmd": "setEnabled", "enabled": 1, "clientId": "${props.client.clientId}"}`;
        setEnabled(1)
      }
      if (props.client.clientId === 'all') {
        mqttPublish(topic, payload)  // looks weird, Doing it this way publishes the cmd before the rsp
        topic = `a/rsp/${props.client.clientId}`
        if (enabled) {
          payload = `{"rsp": "setEnabled", "enabled": 0, "clientId": "${props.client.clientId}"}`;
        } else {
          payload = `{"rsp": "setEnabled", "enabled": 1, "clientId": "${props.client.clientId}"}`;
        }
      }
    } else {
      console.log('   unknown button pressed ', name, '');
      return;
    }
    if (payload) {
      console.log('   send ', topic, payload)
      mqttPublish(topic, payload)
    }
  }

  return (
    <Box className={`client ${props.client.clientId}`} key={`${props.client.id}`}>
      <input id={props.id} type='checkbox' name={props.client.id} onChange={props.onChangeH} checked={props.client.selected ? "checked" : ""} />
      <span className='clientName' htmlFor={props.client.clientId}>{props.client.name}</span>

      {props.id !== 'administrator' && props.id !== 'drupal' && props.id.indexOf('hmi') < 0  && props.id !== 'project' && props.id !== "controller" &&
        <Tooltip label="Enable" bg="white" p="10px" placement="bottom">
          <Button variant="client" className={`small enabled ${enabled ? "true" : "false"}`} onClick={onClickH}>E</Button>
        </Tooltip>
      }

      <Tooltip label="Request status" bg="white" p="10px" placement="bottom">
        <Button variant="client" className={`small status ${running}`}   onClick={onClickH}>{numRunning}</Button>
      </Tooltip>

      {props.id !== 'all' &&
        <Tooltip label="Reset client" bg="white" p="10px" placement="bottom">
          <Button variant="client" className="small reset"    onClick={onClickH}>R</Button>
        </Tooltip>
      }

      {props.id !== 'all' &&
        <Box className="debug-level-wrapper">
          <Tooltip label="Set Debug Level" bg="white" p="10px" placement="bottom">
            <Select variant="client" className="small debug-level" value={debugLevel} onChange={onSelectH}>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </Select>
          </Tooltip>
        </Box>
      }

      {props.client.clientId.indexOf("arduino") > -1 &&
        <Tooltip label="Find One wire sensors" bg="white" p="10px" placement="bottom">
          <Button variant="client" className={`small findOneWireDevices`} onClick={onClickH}>F</Button>
        </Tooltip>
      }

      {props.client.clientId.indexOf("arduino") > -1 &&
        <Tooltip label="Read Inputs" bg="white" p="10px" placement="bottom">
          <Button variant="client" className={`small read-inputs`} onClick={onClickH}>I</Button>
        </Tooltip>
      }
    </Box> )
}
export default MqttClient;