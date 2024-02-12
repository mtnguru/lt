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
  var { projectId, metricId, sourceId } = props
  metricId = metricId.toLowerCase()
  projectId = projectId.toLowerCase()
  const metric = global.aaa.metrics[metricId]
  const v = metric?.v?.[sourceId]?.["value"]?.val
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
//    const f = "ControlMetric::metricCB"
//    console.log(f,"enter ", topic)
    if (sourceId !== tags.SourceId) return
    setVal((prevValue) => {
      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, topic, payload, tags, values)
    }
  }, [props, sourceId])

  const onClickH = (event) => {
    // request metrics from admin
    var payload = {
      "cmd": "getMetric",
      "projectId": projectId,
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

  /*
  return (
    <Flex mb={1}>
      <button onClick={onClickH}>
        <Text as="h3" mt={-1} w={28} pt={0} pw={4} fontWeight="bold" fontSize="120%">{props.label}</Text>
      </button>
      <Text variant="metric" display={props.display ? props.display : null}>
        <span>{value.v}</span>
      </Text>
    </Flex>
  )
  */
  return (
    <Flex mb={1}>
      <button onClick={onClickH}>
        <Text as="h3" mt={-1} w="180px" pt={0} pw={4} fontWeight="bold" fontSize="120%">{props.label}</Text>
      </button>
      <Text variant="metric" display={props.display ? props.display : null}>
        <span>{val}</span>
      </Text>
    </Flex>
  )
}

export default ControlMetric