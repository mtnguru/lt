// File: ControlButton.js
import React, {useState} from 'react';

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"
import {makeTagsFromMetric} from "../../utils/influxr"
//const makeTagsFromMetric = require('../../utils/influx')
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
      topic = 'rf/admin/reset/' + props.client
      payload = ''
    } else if (props.type === "toggle") {
      setBtnState((prevState) => {
        return !prevState
      })
      topic = 'rf/user/influx/' + props.client

      const metric = findMetric(props.metricId)
      if (metric == null) return;
      payload = `${makeTagsFromMetric(props.metricId)} value=${btnState ? "1" : "0"}`
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
