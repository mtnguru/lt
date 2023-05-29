import React, {useState} from 'react'
import './MqttClient.scss'

import { Container, Select, Button, Tooltip } from '@chakra-ui/react'

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"

function MqttClient (props) {

  const [enabled, setEnabled] = useState(true)

  const onSelectH = (event) => {
    let topic = `a/cmd/${props.client.clientId}`
    let payload = `{"cmd": "setDebugLevel", "debugLevel": "${event.target.value}"}`;
    console.log('   send ', topic, payload)
    mqttPublish(topic, payload)
  }

  const onClickH = (event) => {
    const f = "Button::clickH"
    const name = event.target.innerText;
    mgDebug(f,'Button pressed',name)
    let topic;
    let payload;
    if (name === "R") {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestReset", "clientId": "${props.client.clientId}"}`;
    } else if (name === "S") {
      topic = `a/cmd/${props.client.clientId}`
      payload = `{"cmd": "requestStatus", "clientId": "${props.client.clientId}"}`;
    } else if (name === "E") {
      topic = `a/cmd/${props.client.clientId}`
      if (enabled) {
        payload = `{"cmd": "setEnabled", "enabled": "false", "clientId": "${props.client.clientId}"}`;
        setEnabled(false)
      } else {
        payload = `{"cmd": "setEnabled", "enabled": "true", "clientId": "${props.client.clientId}"}`;
        setEnabled(true)
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
            <Select className="debug-level" onChange={onSelectH}>
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