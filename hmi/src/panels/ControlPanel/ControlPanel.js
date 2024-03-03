// File: ControlText.js
import React, {useEffect} from 'react';

import {findMetric} from '../../utils/metrics'

// import ControlText from './ControlText'
import ControlWidget from './ControlWidget'
// import ControlBar from './ControlBar'

import { Container,
         Box,
         Flex,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

import './ControlPanel.scss'
import MqttItem from "../MqttPanel/MqttItem";
import {mqttRegisterMetricCB} from "../../utils/mqttReact";

var initialized = false

const ControlPanel = (props) => {
  const regions = props.options.regions
  const top = regions?.top?.metrics || {}
  const left = regions?.left?.metrics || {}
  const right = regions?.right?.metrics || {}
  const bottom = regions?.bottom?.metrics || {}

  if (!initialized) {
    initialized = true
    if (Object.keys(top).length) {
      top.map((metric,index) => {
        var fmetric = findMetric(metric.metricId)
        top[index] = {...fmetric, ...metric}
      })
    }
    if (Object.keys(left).length) {
      left.map((metric,index) => {
        var fmetric = findMetric(metric.metricId)
        left[index] = {...fmetric, ...metric}
      })
    }
    if (Object.keys(right).length) {
      right.map((metric,index) => {
        var fmetric = findMetric(metric.metricId)
        right[index] = { ...fmetric, ...metric }
      })
    }
    if (Object.keys(bottom,).length) {
      bottom.map((metric,index) => {
        var fmetric = findMetric(metric.metricId)
        bottom[index] = { ...fmetric, ...metric }
      })
    }
  }

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  return (
    <Container className="control-panel mqtt-clientId-bg" maxWidth="auto">
      { regions.header && <h3>Control panel</h3> }
      <Box className="control-top">
        { top.length > 0 && top.map(
          metric => <ControlWidget key={metric.metricId + metric.actionId} projectId={props.options.projectId} metric={metric} />)
        }
      </Box>
      <Flex className="control-middle">
        <Box className="control-left">
          { left.length > 0 && left.map(
            metric => <ControlWidget key={metric.metricId + metric.actionId} projectId={props.options.projectId} metric={metric} />)
          }
        </Box>
        <Box className="control-right">
          { right.length > 0 && right.map(
            metric => <ControlWidget key={metric.metricId + metric.actionId} projectId={props.options.projectId} metric={metric} />)
          }
        </Box>
      </Flex>
      <Box className="control-bottom">
        { bottom.length > 0 && bottom.map(
          metric => <ControlWidget key={metric.metricId + metric.actionId} projectId={props.options.projectId} metric={metric} /> )
        }
      </Box>
    </Container>
  )
}

export default ControlPanel
