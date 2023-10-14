// File: ControlText.js
// import React, {useState} from 'react';

import ControlMetric from './ControlMetric'
import ControlSlider from './ControlSlider'

import {
  Box,
  Heading
} from '@chakra-ui/react'

//import './ControlOxyPanel.scss'

const ControlOxyPanel = (props) => {

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const onChange = (event) => {
//  setValue(parseFloat(event.target.value).toFixed(metric.decimals))
//  const f = "ControlOxyPanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
    /*
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topic.publish['human'];
    let value = event.target.value;
    let payload = `${metric.human.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
    */
  }


  return (
    <Box className="panel control-oxy-panel mqtt-clientId-bg">
      <Heading as="h4" mt={2} mb={8} fontSize="130%" color="titleFg">Swiss Oxyhydrogen Energy</Heading>
      <Box className="controls" >
        <Box className="control-bar gas-flow"       mb={10}>
          <ControlMetric metricId="E1_Ez_SmartTrack_slpm" label="HHO Flow" cname=""></ControlMetric>
          <ControlSlider metricId="E1_Ez_SmartTrack_slpm" onChange={onChange} />
        </Box>
        <Box className="control-bar voltage"        mb={10}>
          <ControlMetric metricId="E1_PS_H_V" label="PS Volts" cname=""></ControlMetric>
          <ControlSlider metricId="E1_PS_H_V" onChange={onChange} />
        </Box>
        <Box className="control-bar amps"           mb={10}>
          <ControlMetric metricId="E1_PS_H_A" label="PS Amps" cname=""></ControlMetric>
          <ControlSlider metricId="E1_PS_H_A" onChange={onChange} />
        </Box>
        <Box className="control-bar ez-temperature" mb={10}>
          <ControlMetric metricId="E1_Ez_Mtr_C" label="Ez Temp" cname=""></ControlMetric>
          <ControlSlider metricId="E1_Ez_Mtr_C" onChange={onChange} />
        </Box>
      </Box>
    </Box>
  )
}

export default ControlOxyPanel