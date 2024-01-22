// File: ControlText.js
// import React, {useState} from 'react';

import ControlMetric from './ControlMetric'
import ControlSlider from './ControlSlider'

import {
  Box,
  Heading
} from '@chakra-ui/react'

import './ControlOxyPanel.scss'

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
    const topic = global.aaa.topic.publish['hum'];
    let value = event.target.value;
    let payload = `${metric.hum.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
    */
  }


  return (
    <Box className="panel control-oxy-panel mqtt-clientId-bg">
      <Heading as="h2" mt={2} mb={8} fontSize="130%" color="titleFg">Swiss Oxyhydrogen Energy</Heading>
      <Box className="controls" >
        <Box className="control-bar gas-flow"       mb={10}>
          <ControlMetric                     projectId={global.aaa.projectId} sourceId="hum"   metricId="Ez_NA_SmartTrack_slpm" label="HHO Flow" cname=""></ControlMetric>
          <ControlSlider title="Value"       projectId={global.aaa.projectId} sourceId="hum"   metricId="Ez_NA_SmartTrack_slpm" onChange={onChange} />
          <ControlSlider title="Upper Alarm" projectId={global.aaa.projectId} sourceId="upper" metricId="Ez_NA_SmartTrack_slpm" onChange={onChange} />
          <ControlSlider title="Lower Alarm" projectId={global.aaa.projectId} sourceId="lower" metricId="Ez_NA_SmartTrack_slpm" onChange={onChange} />
          <ControlSlider title="Upper Range" projectId={global.aaa.projectId} sourceId="high"  metricId="Ez_NA_SmartTrack_slpm" onChange={onChange} />
          <ControlSlider title="Lower Range" projectId={global.aaa.projectId} sourceId="low"   metricId="Ez_NA_SmartTrack_slpm" onChange={onChange} />
        </Box>
        <Box className="control-bar voltage"        mb={10}>
          <ControlMetric projectId={global.aaa.projectId} sourceId="hum" metricId="PS_NA_Human_V" label="PS Volts" cname=""></ControlMetric>
          <ControlSlider projectId={global.aaa.projectId} sourceId="hum" metricId="PS_NA_Human_V" onChange={onChange} />
        </Box>
        <Box className="control-bar amps"           mb={10}>
          <ControlMetric projectId={global.aaa.projectId} sourceId="hum" metricId="PS_NA_Human_A" label="PS Amps" cname=""></ControlMetric>
          <ControlSlider projectId={global.aaa.projectId} sourceId="hum" metricId="PS_NA_Human_A" onChange={onChange} />
        </Box>
        <Box className="control-bar ez-temperature" mb={10}>
          <ControlMetric projectId={global.aaa.projectId} sourceId="hum" metricId="Ez_NA_Mtr_C" label="Ez Temp" cname=""></ControlMetric>
          <ControlSlider projectId={global.aaa.projectId} sourceId="hum" metricId="Ez_NA_Mtr_C" onChange={onChange} />
        </Box>
      </Box>
    </Box>
  )
}

export default ControlOxyPanel
