// File: ControlMetric.js
import React, {useState, useEffect} from 'react';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'

import {
  Text,
  Flex,
} from '@chakra-ui/react'



//import './ControlMetric.scss'

const ControlMetric = (props) => {
  const [value, setValue] = useState(0);
//const [metric, setMetric] = useState({});

  const { metricId } = props

  const metricCB = (metric, topic, payload, tags, values) => {
//    const f = "ControlMetric::metricCB"
//    console.log(f,"enter ", topic)
    if (props.sourceId !== tags.SourceId) return
    setValue((prevValue) => {
      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, topic, payload, tags, values)
    }
  }

  useEffect(() => {
//  setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
  }, [metricId])
  return (
    <Flex mb={1}>
      <Text as="h3" mt={-1} w={28} pt={0} pw={4} fontWeight="bold" fontSize="120%">{props.label}</Text>
      <Text variant="metric" display={props.display ? props.display : null}>
        <span>{value}</span>
      </Text>
    </Flex>
  )
}

export default ControlMetric