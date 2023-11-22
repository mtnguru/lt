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

  const [metric, setMetric] = useState(findMetric(metricId));
  const [value, setValue] = useState(metric.hum.default)
//const [outValue, setOutValue] = useState(0)

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const sourceId = topic.split('/')[1]
    const userId = topic.split('/')[3]
    if (sourceId === 'hum' && userId !== global.aaa.userId) {
      setValue(values.value)
    } else if (sourceId === 'out') {
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
      setValue((prev) => Math.min(prev + metric.hum.step, 100));
    } else if (e.key === "ArrowLeft") {
      setValue((prev) => Math.max(prev - metric.hum.step, 10));
    }
  }


const onChangeH = (_value) => {

  const f = "ControlSliderPanel::onChange"
    console.log('onChange', _value);
    if (!metric) {
      mgError(0, f, "Metric not found: ")
      return;
    }
    setValue(parseFloat(_value).toFixed(metric.decimals))
    const topic = global.aaa.topics.publish['hum'].replace('DUSERID', global.aaa.userId);

    let payload = `${metric.hum.tags} value=${parseFloat(_value).toFixed(metric.decimals)}`
    mqttPublish(topic, payload)
  }

  return (
    <Flex w="full">
      <NumberInput
        min={metric.hum.min}
        max={metric.hum.max}
        step={metric.hum.step}
        w="5em"
        h="30px"
        size="sm"
        mr='2rem'
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
            min={metric.hum.min}
            max={metric.hum.max}
            step={metric.hum.step}
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
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.hum.min}</Text>
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.hum.min + (metric.hum.max-metric.hum.min)/2}</Text>
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.hum.max}</Text>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  )
}

export default ControlSlider
