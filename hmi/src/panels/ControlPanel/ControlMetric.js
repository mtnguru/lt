// File: ControlMetric.js
import React, {useCallback, useState, useEffect} from 'react';
import {mqttRegisterMetricCB, mqttPublish} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'
import ControlMetricPopup from './ControlMetricPopup'
import {WarningIcon} from '@chakra-ui/icons'

import {
  Text,
  Box,
//Flex,
} from '@chakra-ui/react'

//import './ControlMetric.scss'

const yaml = require('js-yaml')

const ControlMetric = (props) => {
  const { cmetric } = props
  const metric = cmetric.metric

  var v = metric?.v?.[cmetric.actionId]?.["value"]?.val
  v = parseFloat(v).toFixed(metric?.decimals || 2);
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, actionId, topic, payload, tags, values) => {
//    const f = "ControlMetric::metricCB"
//    console.log(f,"enter ", topic)
    if (cmetric.actionId !== tags.ActionId) return
    setVal((prevValue) => {
      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, actionId, topic, payload, tags, values)
    }
  }, [props, cmetric.actionId])

  const onClickH = (event) => {
    // request metrics from admin
    var payload = {
      "cmd": "getMetric",
      "projectId": cmetric.projectId,
      "metricId": cmetric.metricId,
      "clientId": global.aaa.clientId,
    }
    var pjson = JSON.stringify(payload)
    const topic = "a/cmd/administrator"
    mqttPublish(topic,pjson)
    // a/req/administrator a metric id
  }

  useEffect(() => {
    mqttRegisterMetricCB(cmetric.projectId,cmetric.actionId,cmetric.metricId, metricCB)
  }, [cmetric, metricCB])

  const content = () => {
    const v = yaml.dump(metric.v,{lineWidth: -1})
    return (
      <div className="content">
        <div className="desc">{`${metric.desc}`}</div>
        <div className="name">{`MetricId: ${metric.name}`}</div>
        <div className="clientId">{`ClientId: ${metric[cmetric.actionId].clientId}`}</div>
        <div className="action">{`Action: ${cmetric.actionId}`}</div>
        <div className="channel">{`Channel: ${metric[cmetric.actionId].channelType}`}</div>
        <div className="v">V: <pre>{v}</pre></div>
      </div>
    )
  }

  return (
    <Box className="control-metric-wrapper">
      <Box className="control-metric">
        <Box className="right" display={props.display ? props.display : null}>
          <WarningIcon></WarningIcon>
          <ControlMetricPopup title={metric.label} content={content()} trigger={val}/>
        </Box>
      </Box>
      <button onClick={onClickH}>
        <Text as="h3" fontWeight="bold" fontSize="120%" style={{backgroundColor:metric.color}}>{metric.label}</Text>
      </button>
    </Box>
  )
}

export default ControlMetric