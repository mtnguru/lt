// File: ControlButton.js
import React, {useState} from 'react';

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"
import {makeTagsFromMetricId} from "../../utils/influxr"
import {findMetric} from "../../utils/metrics"

import "./ControlButton.scss";

const ControlButton = (props) => {
  const [btnState, setBtnState] = useState(false)
  const clickH = (event) => {
    const f = "ControllButton::clickH"
    mgDebug(f,'Button pressed',event.target.id)
    let topic;
    let payload;
    if (props.type === "push") {
      topic = 'lab1/admin/reset/' + props.client
      payload = ''
    } else if (props.type === "toggle") {
      setBtnState((prevState) => {
        return !prevState
      })
      topic = 'lab1/user/influx/' + props.client

      const metric = findMetric(props.metricId)
      if (metric == null) return;
      payload = `${makeTagsFromMetricId(props.metricId), "hum"} value=${btnState ? "1" : "0"}`
    }
    console.log('   send ', topic, payload)
//  props.onclick(event)
    mqttPublish(topic, payload)
  }

  return (
    <div className={`control-button ${props.cname}`}>
      <button onClick={clickH} className={btnState ? "on" : "off"}>{props.label}</button>
    </div>
  )
}

export default ControlButton
