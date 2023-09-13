// File: ControlSlider.js
import React, {useState, useEffect} from 'react';

import './ControlSlider.scss'
import {mqttPublish, mqttRegisterMetricCB} from '../../utils/mqttReact'
import {findMetric} from '../../utils/metrics'
import {mgError} from "../../utils/mg";

const ControlSlider = (props) => {

  const metric = findMetric(props.metricId)
//const [metric, setMetric] = useState({});
  const [value, setValue] = useState(metric.human.default)
  const [outValue, setOutValue] = useState(0)

  useEffect(() => {
    mqttRegisterMetricCB(props.metricId, metricCB)
//  setMetric(findMetric(props.metricId))
  }, [props.metricId])

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "ControlMetric::metricCB"
    const funcId = topic.split('/')[2]
    if (funcId === 'human') {
//    setValue(values.value)
    } else if (funcId === 'output') {
      setOutValue(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f,"enter ", topic)
  }

  const onChange = (event) => {
    setValue(parseFloat(event.target.value).toFixed(metric.decimals))
    const f = "ControlSliderPanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topics.publish['hum'];
    let value = event.target.value;
    let payload = `${metric.human.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
  }

  return (
    <div className="control-slider">
      {/*<label htmlFor={props.metricId}>{metric.label}</label>*/}
      <div className="container">
        <input
          id={metric.metricId}
          type="range"
          min={metric.human.min}
          max={metric.human.max}
          step={metric.human.step}
          className="slider"
          onInput={onChange}
          value={value}
          list="slider-list" />
        <datalist id="slider-list">
          <option>{metric.human.min}</option>
          <option>{metric.human.min + (metric.human.max - metric.human.min) / 2}</option>
          <option>{metric.human.max}</option>
        </datalist>
        <div className="labels">
          <span className="middle">{metric.human.min + (metric.human.max - metric.human.min) / 2}</span>
          <span className="right">{metric.human.max}</span>
          <span className="left">{metric.human.min}</span>
        </div>
      </div>
      <div className="value">{value}</div>
      {/*<div className="outValue">{outValue}</div>*/}
    </div>
  )
}

export default ControlSlider