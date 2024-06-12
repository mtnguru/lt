// File: ControlText.js
// import React, {useState} from 'react';

import MetricFull from './MetricFull'
import MetricSlider from './MetricSlider'

import {
  Box,
  Heading
} from '@chakra-ui/react'

import './ControlCabinPanel.scss'

const ControlCabinPanel = (props) => {

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const onChange = (event) => {
//  setValue(parseFloat(event.target.value).toFixed(metric.decimals))
//  const f = "ControlCabinPanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
    /*
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topic.publish['hum'];
    let value = event.target.value;
    let payload = `${metric.hum.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
    */
  }


  return (
    <Box className="panel control-manual-panel mqtt-clientId-bg">
      <Heading as="h2" mt={2} mb={8} fontSize="130%" color="titleFg">Manual Entry</Heading>
      <Box className="controls" >
        <Box className="control-bar manual-test"       mb={10}>
          <Metric                     projectId={global.aaa.projectId} actionId="hum"   metricId="Manual_Test_V" label="Manual Test" cname=""></Metric>
          <MetricSlider title="Value"       projectId={global.aaa.projectId} actionId="hum"   metricId="Manual_Test_V" onChange={onChange} />
          <MetricSlider title="Upper Alarm" projectId={global.aaa.projectId} actionId="upper" metricId="Manual_Test_V" onChange={onChange} />
          <MetricSlider title="Lower Alarm" projectId={global.aaa.projectId} actionId="lower" metricId="Manual_Test_V" onChange={onChange} />
          <MetricSlider title="Upper Range" projectId={global.aaa.projectId} actionId="high"  metricId="Manual_Test_V" onChange={onChange} />
          <MetricSlider title="Lower Range" projectId={global.aaa.projectId} actionId="low"   metricId="Manual_Test_V" onChange={onChange} />
        </Box>
      </Box>
    </Box>
  )
}

export default ControlCabinPanel
