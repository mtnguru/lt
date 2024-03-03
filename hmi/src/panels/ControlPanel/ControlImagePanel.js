import React, {useState, useEffect} from 'react'
//import { Heading } from '@chakra-ui/react'
// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
// import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'
// import ControlBar from './ControlBar'
// import {findMetric} from '../../utils/metrics'

import "./ControlImagePanel.scss";

import ControlValue from './ControlValue'

//import './ControlImagePanel.scss'
import {mqttRegisterMetricCB, mqttRequestFile} from "../../utils/mqttReact";
import {findMetric} from "../../utils/metrics";

var metrics = {}

const ControlImagePanel = (props) => {
  var keys = Object.keys(metrics)
  if (keys.length === 0) {
    for (var m = 0; m < props.options.metrics.length; m++) {
      var metricId = props.options.metrics[m].metricId.toLowerCase()
      var metric = findMetric(metricId)
      metrics[metricId] = { ...metric, ...props.options.metrics[m] }
    }
  } else {
  }
  useEffect(() => {
    // Merge config metrics with global metrics
  }, [props.options.metrics])

  return (
    <div className="panel control-image-panel" style={{ backgroundImage: `url(${process.env.PUBLIC_URL + "/cabin.png"})`, aspectRatio: 1.1275 }} >
      {/* <Heading as="h3">Overlay Image Panel</Heading> */}
      <div className="controls">
        <div className="metrics">
          {Object.keys(metrics).map((metricId) => {
            return <ControlValue key={metricId} metric={metrics[metricId]} metricId={metricId}></ControlValue>
          })}
        </div>
      </div>
    </div>
  )
}

export default ControlImagePanel