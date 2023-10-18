// File: ControlText.js
// import React, {useState} from 'react';

import ControlMetric from './ControlMetric'
//import ControlNumber from './ControlNumber'
//import ControlButton from './ControlButton'
import ControlSlider from './ControlSlider'

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
          <ControlMetric metricId="Ch_NA_Human_PSI" type="status" label="Pressure" cname=""></ControlMetric>
          <ControlSlider clientId="hmi" metricId="Ch_NA_Human_PSI" onChange={onChange} />
        </div>
        <div className="control-bar voltage">
          <ControlMetric metricId="PS_NA_Pico_V" type="status" label="Voltage" cname=""></ControlMetric>
        </div>
        <div className="control-bar amps">
          <ControlMetric metricId="PS_NA_Pico_A" type="status" label="Amps" cname=""></ControlMetric>
        </div>
        <div className="control-bar internal">
          <ControlMetric metricId="Ch_Internal_K_C" type="status" label="Internal" cname=""></ControlMetric>
        </div>
        <div className="control-bar external">
          <ControlMetric metricId="Ch_External_K_C" type="status" label="External" cname=""></ControlMetric>
        </div>
        <div className="control-bar ambient">
          <ControlMetric metricId="Ch_Ambient_K_C" type="status" label="Ambient" cname=""></ControlMetric>
        </div>
      </Box>
    </Box>
  )
}

export default ControlSafirePanel
