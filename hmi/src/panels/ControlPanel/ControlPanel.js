// File: ControlText.js
import React, {useState, useEffect} from 'react';

import {findMetric} from '../../utils/metrics'

// import ControlText from './ControlText'
import MetricWidget from './MetricWidget'
// import ControlBar from './ControlBar'

import { Container,
         Box,
         Flex,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

import './ControlPanel.scss'
//import MqttItem from "../MqttPanel/MqttItem";
//import {mqttRegisterMetricCB} from "../../utils/mqttReact";


const ControlPanel = (props) => {
  const regions = props.options.regions
  const top = regions?.top?.cmetrics || {}
  const left = regions?.left?.cmetrics || {}
  const right = regions?.right?.cmetrics || {}
  const bottom = regions?.bottom?.cmetrics || {}
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setIsInitialized(true)
    if (Object.keys(top).length) {
      top.map((cmetric,index) => {
        cmetric.projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
        cmetric.metric = findMetric(cmetric.projectId, cmetric.metricId)
      })
    }
    if (Object.keys(left).length) {
      left.map((cmetric,index) => {
        cmetric.projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
        cmetric.metric = findMetric(cmetric.projectId, cmetric.metricId)
      })
    }
    if (Object.keys(right).length) {
      right.map((cmetric,index) => {
        cmetric.projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
        cmetric.metric = findMetric(cmetric.projectId, cmetric.metricId)
      })
    }
    if (Object.keys(bottom,).length) {
      bottom.map((cmetric,index) => {
        cmetric.projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
        cmetric.metric = findMetric(cmetric.projectId, cmetric.metricId)
      })
    }
  }, [])

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const createPanel = (() => {
    return (
      <div>
        <Box className="control-top">
          {top.length > 0 && top.map(
            (cmetric, index) => <MetricWidget key={cmetric.metricId + cmetric.actionId + index} cmetric={cmetric}/>)
          }
        </Box>
        <Flex className="control-middle">
          <Box className="control-left">
            {left.length > 0 && left.map(
              (cmetric, index) => <MetricWidget key={cmetric.metricId + cmetric.actionId + index} cmetric={cmetric}/>)
            }
          </Box>
          <Box className="control-right">
            {right.length > 0 && right.map(
              (cmetric, index) => <MetricWidget key={cmetric.metricId + cmetric.actionId + index} cmetric={cmetric}/>)
            }
          </Box>
        </Flex>
        <Box className="control-bottom">
          {bottom.length > 0 && bottom.map(
            (cmetric, index) => <MetricWidget key={cmetric.metricId + cmetric.actionId + index} cmetric={cmetric}/>)
          }
        </Box>
      </div>
    )
  })

  return (
    <Container className="control-panel mqtt-clientId-bg" maxWidth="auto">
      { isInitialized ? createPanel() : (
        <div>Panel is awaiting initialization</div>
      )}
    </Container>
  )
}

export default ControlPanel
