// File: ControlText.js
// import React, {useState} from 'react';

import MetricFull from './MetricFull'
//import MetricNumber from './MetricNumber'
//import ControlButton from './ControlButton'
import MetricSlider from './MetricSlider'

// import ControlBar from './ControlBar'

import {
  Box, Heading,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

//import './ControlSafirePanel.scss'

const ControlSafirePanel = (props) => {

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const onChange = (event) => {
//  setValue(parseFloat(event.target.value).toFixed(metric.decimals))
//  const f = "ControlSafirePanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
    /*
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topic.publish['hum'];
    let value = event.target.value;
    let payload = `${metric.hum.tags} value=${parseFloat(value).toFixed(metric.decimals)}`
    mqttPublish(topic, payload)
    */
  }


  return (
    <Box className="panel control-safire-panel mqtt-clientId-bg">
      <Heading as="h4" mt={2} mb={4} fontSize="150%" color="titleFg">SAFIRE Lab</Heading>
      {/*<h2>Control panel</h2>*/}
      <Box className="controls" >
        <div className="control-bar pressure">
          <Metric metricId="Ch_NA_Human_PSI" type="status" label="Pressure" cname=""></Metric>
          <MetricSlider clientId="hmi" metricId="Ch_NA_Human_PSI" onChange={onChange} />
        </div>
        <div className="control-bar voltage">
          <Metric metricId="PS_NA_Pico_V" type="status" label="Voltage" cname=""></Metric>
        </div>
        <div className="control-bar amps">
          <Metric metricId="PS_NA_Pico_A" type="status" label="Amps" cname=""></Metric>
        </div>
        <div className="control-bar internal">
          <Metric metricId="Ch_Internal_K_C" type="status" label="Internal" cname=""></Metric>
        </div>
        <div className="control-bar external">
          <Metric metricId="Ch_External_K_C" type="status" label="External" cname=""></Metric>
        </div>
        <div className="control-bar ambient">
          <Metric metricId="Ch_Ambient_K_C" type="status" label="Ambient" cname=""></Metric>
        </div>
      </Box>
    </Box>
  )
}

export default ControlSafirePanel
