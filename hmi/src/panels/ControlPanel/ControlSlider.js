// File: ControlSlider.js
import React, {useState, useEffect} from 'react';

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
//import './ControlSlider.scss'
import {mqttPublish, mqttRegisterMetricCB} from '../../utils/mqttReact'
import {findMetric} from '../../utils/metrics'
import {mgError} from "../../utils/mg";

const ControlSlider = (props) => {

  const metricId = props.metricId
  const sourceId = props.sourceId || 'UNK'

  const [metric, setMetric] = useState(findMetric(metricId));
  const [value, setValue] = useState(metric?.[sourceId]?.default || 0)
  const [changing, setChanging] = useState(false)
//const [outValue, setOutValue] = useState(0)

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const msgSourceId = topic.split('/')[1]
//  const userId = topic.split('/')[3]
//  if (msgSourceId === sourceId && userId !== global.aaa.userId) {
    if (changing) {
      setChanging(false)
      return
    }
    if (msgSourceId === sourceId) {
      setValue(values.value)
    } else if (msgSourceId === 'out') {
//    setOutValue(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f, "enter ", topic)
  }

  useEffect(() => {
    setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
  }, [metricId])

  const onKeyH = (e) => {
    if (e.key === "ArrowRight") {
      setValue((prev) => Math.min(prev + metric[sourceId].step, 100));
    } else if (e.key === "ArrowLeft") {
      setValue((prev) => Math.max(prev - metric[sourceId].step, 10));
    }
  }

  const onChangeH = (_value) => {
    const f = "ControlSliderPanel::onChange"
    if (!global.aaa.topics.publish[sourceId]) return;
    console.log(f,'onChange', _value);
    if (!metric) {
      mgError(0, f, "Metric not found: ")
      return;
    }
    setValue(parseFloat(_value).toFixed(metric.decimals))
    const topic = metric[sourceId].topic.replace('DUSERID', global.aaa.userId);

    let payload = `${metric[sourceId].tags} value=${parseFloat(_value).toFixed(metric.decimals)}`
    setChanging(true)
    mqttPublish(topic, payload)
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
          value={value}
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
              value={value}
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
}

export default ControlSlider