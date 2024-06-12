// File: MetricLabel.js
import React, {useCallback, useEffect} from 'react';


import {
  Box, Text,
} from "@chakra-ui/react";
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import "./MetricLabel.scss"

const MetricLabel = (props) => {
  const metric = props.cmetric.metric
  const metricId = props.cmetric.metricId
  const projectId = props.cmetric.projectId
  const actionId = props.cmetric.actionId || 'UNK'

  const metricCB = useCallback((_metric, _actionId, _topic, _payload, tags, values) => {
    const f = "MetricLabel::metricCB"
//  const [,msgActionId,,userId] = _topic.split('/')
//  if (userId === `${global.aaa.userId}-${global.aaa.mqttClientId}`) {
//    return;
//  }
    console.log(f, "enter ", _topic)
  }, [])

  const onClickH = (event) => {

  }

  useEffect(() => {
    mqttRegisterMetricCB(projectId,actionId,metricId, metricCB)
  }, [props.cmetric, projectId, metricId, metricCB,actionId])

  var color;
  var label;
  if (props.cmetric.labelSrc && props.cmetric.labelSrc === 'action') {
    color = global.aaa.actionIds[actionId].color
    label = global.aaa.actionIds[actionId].name
  } else {
    color = props.cmetric.metric.color
    label = props.cmetric.metric.label
  }

  return (
    <Box className="metric-label">
      <button onClick={onClickH}>
        <Text as="h3" fontWeight="bold" fontSize="120%" className="label" style={{backgroundColor:color}}>{label}</Text>
      </button>
    </Box>
  )
}

export default MetricLabel