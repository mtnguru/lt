import React, {useState, useEffect} from 'react'
import './MqttClient.scss'
import { mqttRegisterTopicCB } from '../../utils/mqttReact'

import { Container, Select, Button, Tooltip } from '@chakra-ui/react'

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"

function MqttClient (props) {
  const clientId = props.client.clientId;
  const [enabled, setEnabled] = useState(
    (global.aaa.clients[clientId].status) ? global.aaa.clients[clientId].status.enabled : 1)
  const [debugLevel, setDebugLevel] = useState(
    (global.aaa.clients[clientId].status) ? global.aaa.clients[clientId].status.debugLevel : 0)


  const mqttCB = (_topic, _payload) => {
//  var rsp = _payload.rsp;
    if (_payload.rsp === "setEnabled") {
      setEnabled(_payload.enabled)
    } else if (_payload.rsp === 'setDebugLevel') {
      setDebugLevel(_payload.debugLevel)
    }
  }

  useEffect(() => {
    var topic = global.aaa.topics.register.rsp + '/' + clientId
    mqttRegisterTopicCB(global.aaa.topics.register.rsp, mqttCB, {});
  }, [clientId])

  const onSelectH = (event) => {
    let topic = `a/cmd/${props.client.clientId}`
    let payload = `{"cmd": "setDebugLevel", "clientId": "${clientId}", "debugLevel": "${event.target.value}"}`;
    console.log('   send ', topic, payload)
    mqttPublish(topic, payload)
  }

  const onClickH = (event) => {
    const f = "Button::clickH"
    const name = event.target.innerText;
    mgDebug(1, f,'Button pressed',name)
    let topic;
    let payload;
    if (name === "R") {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestReset", "clientId": "${props.client.clientId}"}`;
    } else if (name === "S") {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestStatus", "clientId": "${props.client.clientId}"}`;
    } else if (name === "E") {
      // Set the "all" button on other labtime instances
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
    <Container className={`checkbox ${props.client.clientId}`} key={`${props.client.id}`}>
      <div className="row1">
        <input id={props.id} type='checkbox' name={props.client.id} onChange={props.onChangeH} checked={props.client.selected ? "checked" : ""} />
        <label htmlFor={props.client.clientId}>{props.client.name}</label>
      </div>
      <div className="row2">
        {props.id !== 'administrator' && props.id !== 'labtime' && props.id !== 'project' &&
          <Tooltip label="Enable" bg="white" p="10px" placement="bottom">
            <Button className={`enabled ${enabled ? "true" : "false"}`} onClick={onClickH}>E</Button>
          </Tooltip>
        }
        <Tooltip label="Request status" bg="white" p="10px" placement="bottom">
          <Button className="status"   onClick={onClickH}>S</Button>
        </Tooltip>
        {props.id !== 'all' &&
          <Tooltip label="Reset client" bg="white" p="10px" placement="bottom">
            <Button className="reset"    onClick={onClickH}>R</Button>
          </Tooltip>
        }
        {props.id !== 'all' &&
          <Tooltip label="Set Debug Level" bg="white" p="10px" placement="bottom">
            <Select className="debug-level" value={debugLevel} onChange={onSelectH}>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </Select>
          </Tooltip>
        }
      </div>
    </Container> )
}
export default MqttClient;
