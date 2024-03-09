
import {useState} from 'react';
import {mqttRegisterMqttStatusCB} from "../../utils/mqttReact";

import './MqttStatus.scss'

var initialized = false

function MqttStatus(props) {

  const [status, setStatus] = useState('unknown')
  const [messageAction, setMessageAction] = useState('inactive')
  const [publishAction, setPublishAction] = useState('inactive')

  const statusCB = (status, actionId) => {
    if (status === 'message') {
      setMessageAction(actionId)
      setTimeout(() => {
        setMessageAction('inactive')
      }, 750)
    } else if (status === 'publish') {
      setPublishAction(actionId)
      setTimeout(() => {
        setPublishAction('inactive')
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
    <div className="mqtt-status-bar mqtt-action-bg">
      <div className={'action'}>
        <span className={`publish indicator ${publishAction}`} />
        <span className={`message indicator ${messageAction}`} />
      </div>
      <div className={`mqtt-status ${status}`}>{status}</div>
    </div>
  )
}

export default MqttStatus;