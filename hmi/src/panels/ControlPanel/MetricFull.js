// File: MetricFull.js
import React, {useCallback, useState, useEffect} from 'react';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'
import MetricPopup from './MetricPopup'
import MetricLabel from './MetricLabel'
import {WarningIcon} from '@chakra-ui/icons'

import {
  Box,
//Flex,
} from '@chakra-ui/react'

import './MetricFull.scss'

const yaml = require('js-yaml')

const MetricFull = (props) => {
  const { cmetric } = props
  const metric = cmetric.metric

  var v = metric?.v?.[cmetric.actionId]?.["value"]?.val
  v = parseFloat(v).toFixed(metric?.decimals || 2);
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, actionId, topic, payload, tags, values) => {
//    const f = "MetricFull::metricCB"
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

  /*
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
  */

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
    <Box className="metric-full">
      <MetricLabel cmetric={props.cmetric} />
      <WarningIcon></WarningIcon>
      <MetricPopup title={metric.label} content={content()} trigger={val}/>
    </Box>
  )
}

export default MetricFull
