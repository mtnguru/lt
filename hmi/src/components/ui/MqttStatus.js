
import {useState} from 'react';
import {mqttRegisterMqttStatusCB} from "../../utils/mqttReact";

import './MqttStatus.scss'

var initialized = false

function MqttStatus(props) {

  const [status, setStatus] = useState('unknown')
  const [messageActive, setMessageActive] = useState('inactive')
  const [publishActive, setPublishActive] = useState('inactive')

  const statusCB = (status) => {
    if (status === 'message') {
      setMessageActive('active')
      setTimeout(() => {
        setMessageActive('inactive')
      }, 750)
    } else if (status === 'publish') {
      setPublishActive('active')
      setTimeout(() => {
        setPublishActive('inactive')
      },750)
    } else {
      setStatus(status)
    }
  }

  if (!initialized) {
    initialized = true
    mqttRegisterMqttStatusCB(statusCB)
  }

  return (
    <div className="mqtt-status-bar">
      <div className={'action'}>
        <span className={`message indicator ${messageActive}`} />
        <span className={`publish indicator ${publishActive}`} />
      </div>
      <div className={`mqtt-status ${status}`}>{status}</div>
    </div>
  )
}

export default MqttStatus;