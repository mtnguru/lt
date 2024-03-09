import React, {useState, useEffect} from 'react'
//import { Heading } from '@chakra-ui/react'
// File: ControlText.js
// import React, {useState} from 'react';

import ControlValue from './ControlValue'
import {mqttRequestFile} from "../../utils/mqttReact";
import {findMetric} from "../../utils/metrics";

import "./ControlImagePanel.scss";

// Local copy of metrics - only for this ControlImagePanel instance
// Store this as an array [] - not object
// cmetrics    component metrics
//   metricId
//   projectId
//   sourceId
//   metric {}

var initialized = false

const ControlImagePanel = (props) => {
  var cmetrics = props.options.cmetrics

  if (!initialized) {
    initialized = true

    // if metrics is empty (first time in) - add metric to each cmetric
    for (var m = 0; m < cmetrics.length; m++) {
      var cmetric = cmetrics[m]
      cmetric.projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
      cmetric.metric = findMetric(cmetric.projectId, cmetric.metricId)
    }
  }

  useEffect(() => {
    // Merge config metrics with global metrics
  }, [props.options.cmetrics])

  return (
    <div className="panel control-image-panel" style={{ backgroundImage: `url(${process.env.PUBLIC_URL + "/cabin.png"})`, aspectRatio: 1.1275 }} >
      {/* <Heading as="h3">Overlay Image Panel</Heading> */}
      <div className="controls">
        <div className="metrics">
          {cmetrics.map((cmetric,index) => {
            var actionId = 'inp'
            const metric = cmetric.metric
            const metricId = cmetric.metricId
            return <ControlValue key={metricId} cmetric={cmetric}></ControlValue>
          })}
        </div>
      </div>
    </div>
  )
}

export default ControlImagePanel