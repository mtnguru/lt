// File: ControlSlider.js
import React, {useCallback, useState, useEffect} from 'react';

import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberIncrementStepper,
//      Text,
  Box,
  Flex, Text
} from "@chakra-ui/react";
import {mqttPublish, mqttRegisterMetricCB} from '../../utils/mqttReact'
import {mgError} from "../../utils/mg";
import "./ControlNumber.scss"

const ControlNumber = (props) => {

  const metricId = props.cmetric.metricId
  const projectId = props.cmetric.projectId
  const actionId = props.cmetric.actionId || 'UNK'

  const v = props.cmetric.metric?.v?.[actionId]?.["value"]?.val
  const [val, setVal] = useState(v);
  const metricCB = useCallback((_metric, _actionId, _topic, _payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const [,msgActionId,,userId] = _topic.split('/')
    if (userId === `${global.aaa.userId}-${global.aaa.mqttClientId}`) {
      return;
    }
    if (_actionId === actionId) {
      setVal(values.value)
    } else if (msgActionId === 'out') {
//    setOutVal(parseFloat(values.value).toFixed(_metric.decimals))
    }
    console.log(f, "enter ", _topic)
  }, [actionId])

  useEffect(() => {
    const f = 'ControlNumber::useEffect'
    var err;
    if (!props.cmetric.metric) {
      err = `Metric not found: ${metricId}`
    } else {
      if (!(actionId in props.cmetric.metric)) {
        err = `${metricId} - Add ${actionId} section to configuration`
      } else {
        if (!('min' in props.cmetric.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'min' to number configuration`
        }
        if (!('max' in props.cmetric.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'max' to number configuration`
        }
        if (!('step' in props.cmetric.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'step' to number configuration`
        }
      }
    }
    mqttRegisterMetricCB(projectId,actionId,metricId, metricCB)
    if (err) {
      mgError(0, f, err)
    }
  }, [props.cmetric, projectId, metricId, metricCB, actionId])

//const onKeyH = (e) => {
//  if (e.key === "ArrowRight") {
//    setVal((prev) => Math.min(prev + props.cmetric.metric[actionId].step, 100));
//  } else if (e.key === "ArrowLeft") {
//    setVal((prev) => Math.max(prev - props.cmetric.metric[actionId].step, 10));
//  }
//}

  const onKeyH = (event) => {
    return 1;
  }

  const onChangeH = (_val, _dude, _dudette) => {
    const f = "ControlNumberPanel::onChange"
    if (!global.aaa.topics.publish[actionId]) return;
    console.log(f,'onChange', _val);
    if (!props.cmetric.metric) {
      mgError(0, f, "Metric not found: ")
      return;
    }
    setVal(parseFloat(_val).toFixed(props.cmetric.metric.decimals))
    const topic = props.cmetric.metric[actionId].topic.replace('DUSERID', `${global.aaa.userId}-${global.aaa.mqttClientId}`);

    let payload = `${props.cmetric.metric[actionId].tags} value=${parseFloat(_val).toFixed(props.cmetric.metric.decimals)}`
    mqttPublish(topic, payload)
  }

  if (!props.cmetric.metric) {
    return (
      <Box>
        <div>Metric not found {metricId}</div>
      </Box>
    )
  }

  return (
    <Box className="control-number">
      <Flex w="full">
        {props.cmetric.label && <Text as="h3" className="label" style={{backgroundColor:props.cmetric.metric.color}}>{props.cmetric.metric.label}</Text>}
        <NumberInput
          min={props.cmetric.metric[actionId].min}
          max={props.cmetric.metric[actionId].max}
          step={props.cmetric.metric[actionId].step}
          value={val}
          onChange={onChangeH}
          className="number"
        >
          <NumberInputField onKeyDown={onKeyH}/>
          <NumberInputStepper>
            <NumberIncrementStepper/>
            <NumberDecrementStepper/>
          </NumberInputStepper>
        </NumberInput>
      </Flex>
    </Box>
  )
}

export default ControlNumber