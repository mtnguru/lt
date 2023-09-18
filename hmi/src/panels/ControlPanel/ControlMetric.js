// File: ControlMetric.js
import React, {useState, useEffect} from 'react';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f, findMetric} from '../../utils/metrics'

import './ControlMetric.scss'

const ControlMetric = (props) => {
  const [value, setValue] = useState(0);
//const [metric, setMetric] = useState({});

  const { metricId } = props

  const metricCB = (metric, topic, payload, tags, values) => {
//    const f = "ControlMetric::metricCB"
//    console.log(f,"enter ", topic)
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
    <div className="control-metrics">
      {/*<div className="metric">{metric && metric.metricId}</div>*/}
      <div className="value">{value}</div>
    </div>
  )
}

export default ControlMetric