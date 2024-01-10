// File: ControlMetric.js
import React, {useCallback, useState, useEffect} from 'react';
import {mqttRegisterMetricCB, mqttPublish} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'

import {
  Text,
  Flex,
} from '@chakra-ui/react'


//import './ControlMetric.scss'

const ControlMetric = (props) => {
  const [value, setValue] = useState(0);
//const [metric, setMetric] = useState({});

  const { processId, metricId } = props

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
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
  }, [props])

  const onClickH = (event) => {
    // request metrics from admin
    var payload = {
      "cmd": "getMetric",
      "processId": processId,
      "metricId": metricId,
      "clientId": global.aaa.clientId,
    }
    var pjson = JSON.stringify(payload)
    const topic = "a/cmd/administrator"
    mqttPublish(topic,pjson)
    // a/req/administrator a metric id
  }

  useEffect(() => {
//  setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
  }, [metricId, metricCB])

  const valueLink = ""

  return (
    <Flex mb={1}>
      <button onClick={onClickH}>
        <Text as="h3" mt={-1} w={28} pt={0} pw={4} fontWeight="bold" fontSize="120%">{props.label}</Text>
      </button>
      <Text variant="metric" display={props.display ? props.display : null}>
        <span>{value}</span>
      </Text>
    </Flex>
  )
}

export default ControlMetric
