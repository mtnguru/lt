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
  const [value, setValue] = useState(metric.human.default)
//const [outValue, setOutValue] = useState(0)

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const funcId = topic.split('/')[2]
    const userId = topic.split('/')[4]
    if (funcId === 'hum' && userId !== global.aam.mqttClientId) {
      setValue(values.value)
    } else if (funcId === 'out') {
//    setOutValue(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f, "enter ", topic)
  }

  useEffect(() => {
    setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
  }, [metricId])

  const onChangeH = (_value) => {
    const f = "ControlSliderPanel::onChange"
    console.log('onChange', _value);
    if (!metric) {
      mgError(0, f, "Metric not found: ")
    }
    setValue(parseFloat(_value).toFixed(metric.decimals))
    const topic = global.aaa.topics.publish['hum'].replace('DUSERID', global.aam.mqttClientId);

    let payload = `${metric.human.tags} value=${parseFloat(_value).toFixed(metric.decimals)}`
    mqttPublish(topic, payload)
  }

  return (
    <Flex>
      <NumberInput
        min={metric.human.min}
        max={metric.human.max}
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

      <Flex align="center" justify="center">
        <Box width="300px">
          {/* Slider */}
          <Slider
            min={metric.human.min}
            max={metric.human.max}
            size="sm"
            flex='1'
            focusThumbOnChange={false}
            value={value}
            onChange={onChangeH}
            mb={0}
            pb={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                setValue((prev) => Math.min(prev + 1, 100));
              } else if (e.key === "ArrowLeft") {
                setValue((prev) => Math.max(prev - 1, 10));
              }
            }}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb fontSize='60%' boxSize='20px' children={value}/>
          </Slider>

          <Flex mt={-2} justifyContent="space-between">
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.human.min}</Text>
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.human.min + (metric.human.max-metric.human.min)/2}</Text>
            <Text verticalAlign="middle" fontSize="xs" mb="1">{metric.human.max}</Text>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  )
}

export default ControlSlider