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

const ControlSlider = (props) => {

  const metricId = props.metricId.toLowerCase()
//const projectId = props.projectId.toLowerCase
  const sourceId = props.sourceId || 'UNK'

  const [metric, setMetric] = useState(findMetric(metricId));
  const v = metric?.v?.[sourceId]?.["value"]?.val
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const [,msgSourceId,,userId] = topic.split('/')
    if (userId === `${global.aaa.userId}-${global.aaa.mqttClientId}`) {
      return;
    }
    if (msgSourceId === sourceId) {
      setVal(values.value)
    } else if (msgSourceId === 'out') {
//    setOutVal(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f, "enter ", topic)
  }, [sourceId])

  useEffect(() => {
    const f = 'ControlSlider::useEffect'
    const m = findMetric(metricId)
    var err;
    if (!m) {
      err = `Metric not found: ${metricId}`
    } else {
      if (!(sourceId in metric)) {
        err = `${metricId} - Add ${sourceId} section to configuration`
      } else {
        if (!('min' in metric[sourceId])) {
          err = `${metricId} - ${sourceId} -- Add 'min' to slider configuration`
        }
        if (!('max' in metric[sourceId])) {
          err = `${metricId} - ${sourceId} -- Add 'max' to slider configuration`
        }
        if (!('step' in metric[sourceId])) {
          err = `${metricId} - ${sourceId} -- Add 'step' to slider configuration`
        }
      }
    }
    setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
    if (err) {
      mgError(0, f, err)
    }
  }, [metric, metricId, metricCB, sourceId])

  const onKeyH = (e) => {
    if (e.key === "ArrowRight") {
      setVal((prev) => Math.min(prev + metric[sourceId].step, 100));
    } else if (e.key === "ArrowLeft") {
      setVal((prev) => Math.max(prev - metric[sourceId].step, 10));
    }
  }

  const onChangeH = (_val) => {
    const f = "ControlSliderPanel::onChange"
    if (!global.aaa.topics.publish[sourceId]) return;
    console.log(f,'onChange', _val);
    if (!metric) {
      mgError(0, f, "Metric not found: ")
      return;
    }
    setVal(parseFloat(_val).toFixed(metric.decimals))
    const topic = metric[sourceId].topic.replace('DUSERID', `${global.aaa.userId}-${global.aaa.mqttClientId}`);

    let payload = `${metric[sourceId].tags} value=${parseFloat(_val).toFixed(metric.decimals)}`
    mqttPublish(topic, payload)
  }

  if (!metric) {
    return (
      <Box>
        <div>Metric not found {metricId}</div>
      </Box>
    )
  }

  return (
    <Box>
      {props.title && <h4 className="title">{props.title}</h4>}
      <Flex w="full">
        <NumberInput
          min={metric[sourceId].min}
          max={metric[sourceId].max}
          step={metric[sourceId].step}
          w="5em"
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
              min={metric[sourceId].min}
              max={metric[sourceId].max}
              step={metric[sourceId].step}
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
              <SliderThumb fontSize='60%' boxSize='20px' children={val} />
            </Slider>

            <Flex mt={-2} justifyContent="space-between">
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].min}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].min + (metric[sourceId].max-metric[sourceId].min)/2}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].max}</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
  /*
  return (
    <Box>
      {props.title && <h4 className="title">{props.title}</h4>}
      <Flex w="full">
        <NumberInput
          min={metric[sourceId].min}
          max={metric[sourceId].max}
          step={metric[sourceId].step}
          w="5em"
          h="30px"
          size="sm"
          mr='1rem'
          value={value.v}
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
              min={metric[sourceId].min}
              max={metric[sourceId].max}
              step={metric[sourceId].step}
              size="sm"
              focusThumbOnChange={false}
              value={value.v}
              onChange={onChangeH}
              mb={0}
              pb={0}
              onKeyDown={onKeyH}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize='60%' boxSize='20px' children={value}/>
            </Slider>

            <Flex mt={-2} justifyContent="space-between">
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].min}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].min + (metric[sourceId].max-metric[sourceId].min)/2}</Text>
              <Text verticalAlign="middle" fontSize="xs" mb="1">{metric[sourceId].max}</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
   */
}

export default ControlSlider