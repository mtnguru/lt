// File: ControlText.js
// import React, {useState} from 'react';

import ControlMetric from './ControlMetric'

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
          <ControlMetric projectId={global.aaa.projectId} sourceId="inp" metricId="Desk_Top_OW_F" label="Desk Top" cname=""></ControlMetric>
        </Box>
        <Box className="control-bar desk-monitor">
          <ControlMetric projectId={global.aaa.projectId} sourceId="inp" metricId="Desk_Monitor_OW_F" label="Desk Monitor" cname=""></ControlMetric>
        </Box>
        <Box className="control-bar bathroom">
          <ControlMetric projectId={global.aaa.projectId} sourceId="inp" metricId="Bathroom_Door_K_F" label="Bathroom" cname=""></ControlMetric>
        </Box>
        <Box className="control-bar master">
          <ControlMetric projectId={global.aaa.projectId} sourceId="inp" metricId="Master_Door_OW_F" label="Master Bedroom" cname=""></ControlMetric>
        </Box>
        <Box className="control-bar middle">
          <ControlMetric projectId={global.aaa.projectId} sourceId="inp" metricId="Middle_Window_K_F" label="Middle Bedroom" cname=""></ControlMetric>
        </Box>
      </Box>
    </Box>
  )
}

export default ControlCabinPanel