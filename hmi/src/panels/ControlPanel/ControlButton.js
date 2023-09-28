// File: ControlButton.js

import React, {useState} from 'react';
import { mqttPublish } from '../../utils/mqttReact'

//import {makeTagsFromMetric} from "../../utils/influxr"
//import {findMetric} from "../../utils/metrics"

//import "./ControlButton.scss";

const ControlButton = (props) => {
  const [btnState, setBtnState] = useState(false)

  const clickH = (event) => {
    setBtnState(!btnState);
    var topic = global.aaa.topics.publish.out.replace(/DCLIENTID/,props.clientId)
    var payload = {
      clientId: props.clientId,

    }
    var payloadStr = JSON.stringify(payload)
    mqttPublish(topic,payloadStr)
    props.clickH(event)
  }

  return (
    <div className={`control-button ${props.cname}`}>
      <button onClick={clickH} className={btnState ? "on" : "off"} title={props.title}>{props.label}</button>
    </div>
  )
}

export default ControlButton
