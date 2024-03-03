// File: ControlSlider.js
import React, {useCallback, useState, useEffect} from 'react';

import {NumberInput,
        NumberInputField,
        NumberInputStepper,
        NumberDecrementStepper,
        NumberIncrementStepper,
        Slider,
        SliderTrack,
        SliderFilledTrack,
        SliderThumb,
        Text,
        Box,
        Flex} from "@chakra-ui/react";
import {mqttPublish, mqttRegisterMetricCB} from '../../utils/mqttReact'
import {findMetric} from '../../utils/metrics'
import {mgError} from "../../utils/mg";
import "./ControlSlider.scss"

const ControlSlider = (props) => {

  const metricId = props.metric.metricId
  const projectId = props.projectId
  const actionId = props.metric.actionId || 'UNK'

  const v = props.metric?.v?.[actionId]?.["value"]?.val
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const [,msgActionId,,userId] = topic.split('/')
    if (userId === `${global.aaa.userId}-${global.aaa.mqttClientId}`) {
      return;
    }
    if (msgActionId === actionId) {
      setVal(values.value)
    } else if (msgActionId === 'out') {
//    setOutVal(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f, "enter ", topic)
  }, [actionId])

  useEffect(() => {
    const f = 'ControlSlider::useEffect'
    const m = findMetric(metricId)
    var err;
    if (!m) {
      err = `Metric not found: ${metricId}`
    } else {
      if (!(actionId in props.metric)) {
        err = `${metricId} - Add ${actionId} section to configuration`
      } else {
        if (!('min' in props.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'min' to slider configuration`
        }
        if (!('max' in props.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'max' to slider configuration`
        }
        if (!('step' in props.metric[actionId])) {
          err = `${metricId} - ${actionId} -- Add 'step' to slider configuration`
        }
      }
    }
    mqttRegisterMetricCB(metricId, metricCB)
    if (err) {
      mgError(0, f, err)
    }
  }, [props.metric, metricId, metricCB, actionId])

  const onKeyH = (e) => {
    if (e.key === "ArrowRight") {
      setVal((prev) => Math.min(prev + props.metric[actionId].step, 100));
    } else if (e.key === "ArrowLeft") {
      setVal((prev) => Math.max(prev - props.metric[actionId].step, 10));
    }
  }

  const onChangeH = (_val) => {
    const f = "ControlSliderPanel::onChange"
    if (!global.aaa.topics.publish[actionId]) return;
    console.log(f,'onChange', _val);
    if (!props.metric) {
      mgError(0, f, "Metric not found: ")
      return;
    }
    setVal(parseFloat(_val).toFixed(props.metric.decimals))
    const topic = props.metric[actionId].topic.replace('DUSERID', `${global.aaa.userId}-${global.aaa.mqttClientId}`);

    let payload = `${props.metric[actionId].tags} value=${parseFloat(_val).toFixed(props.metric.decimals)}`
    mqttPublish(topic, payload)
  }

  if (!props.metric) {
    return (
      <Box>
        <div>Metric not found {metricId}</div>
      </Box>
    )
  }

  return (
    <Box className="control-slider">
      {props.title && <h4 className="title">{props.title}</h4>}
      <Flex w="full">
        <NumberInput
          min={props.metric[actionId].min}
          max={props.metric[actionId].max}
          step={props.metric[actionId].step}
          w="6em"
          h="30px"
          size="sm"
          mr='1rem'
          value={val}
          onChange={onChangeH}
        >
          <NumberInputField/>
          <NumberInputStepper>
            <NumberIncrementStepper/>
            <NumberDecrementStepper/>
          </NumberInputStepper>
        </NumberInput>
        <Flex flex="3" align="center" justify="center">
          <Box
            flex='1'
          >
            <Slider
              min={props.metric[actionId].min}
              max={props.metric[actionId].max}
              step={props.metric[actionId].step}
              size="sm"
              focusThumbOnChange={false}
              value={val}
              onChange={onChangeH}
              mb={0}
              pb={0}
              onKeyDown={onKeyH}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize='80%' boxSize='20px' children={val} />
            </Slider>

            <Flex mt={-2} justifyContent="space-between">
              <Text verticalAlign="middle" fontSize="xs" mb="1">{props.metric[actionId].min}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{props.metric[actionId].min + (props.metric[actionId].max-props.metric[actionId].min)/2}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{props.metric[actionId].max}</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}

export default ControlSlider
