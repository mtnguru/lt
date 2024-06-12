// File: ControlText.js
// import React, {useState} from 'react';

import MetricFull from './MetricFull'

import {
  Box,
} from '@chakra-ui/react'

import './ControlCabinPanel.scss'

const ControlCabinPanel = (props) => {

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  /*
  const onChange = (event) => {
//  setValue(parseFloat(event.target.value).toFixed(metric.decimals))
//  const f = "ControlCabinPanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topic.publish['hum'];
    let value = event.target.value;
    let payload = `${metric.hum.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
  }
  */

  return (
    <Box className="panel control-cabin-panel mqtt-clientId-bg">
      <Box className="controls" >
        <Box className="control-bar desk-top" mt="20px">
          <Metric projectId={global.aaa.projectId} actionId="inp" metricId="Desk_Top_OW_F" label="Desk Top" cname=""></Metric>
        </Box>
        <Box className="control-bar desk-monitor">
          <Metric projectId={global.aaa.projectId} actionId="inp" metricId="Desk_Monitor_OW_F" label="Desk Monitor" cname=""></Metric>
        </Box>
        <Box className="control-bar bathroom">
          <Metric projectId={global.aaa.projectId} actionId="inp" metricId="Bathroom_Door_K_F" label="Bathroom" cname=""></Metric>
        </Box>
        <Box className="control-bar master">
          <Metric projectId={global.aaa.projectId} actionId="inp" metricId="Master_Door_OW_F" label="Master Bedroom" cname=""></Metric>
        </Box>
        <Box className="control-bar middle">
          <Metric projectId={global.aaa.projectId} actionId="inp" metricId="Middle_Window_K_F" label="Middle Bedroom" cname=""></Metric>
        </Box>
      </Box>
    </Box>
  )
}

export default ControlCabinPanel
