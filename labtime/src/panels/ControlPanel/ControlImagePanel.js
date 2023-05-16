import React, {useState, useEffect} from 'react'
// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
// import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'
// import ControlBar from './ControlBar'
// import {findMetric} from '../../utils/metrics'

import ControlValue from './ControlValue'

import './ControlImagePanel.scss'
import {mqttRequestFile} from "../../utils/mqttReact";

const ControlImagePanel = (props) => {
  const [hmi, setHmi] = useState({ inputs: {}})

  const panelId = props.panelId
  useEffect(() => {
    const onLoadCB = (topic, payload) => {
      global.aaa[panelId] = payload;
      setHmi(global.aaa[panelId])
    }
    mqttRequestFile(global.aaa.clientId, panelId, `labtime/panels/${panelId}.yml`, 'yml', onLoadCB)
  }, [panelId])

  return (
    <div className="panel control-expt-panel mqtt-client-bg">
        <h2>Overlay Image Panel</h2>
        <div className="control-flex">
          <div className="stats">
            {Object.keys(hmi.inputs).map((metricId) => {
              return <ControlValue key={metricId} metric={hmi.inputs[metricId]} metricId={metricId}></ControlValue>
            })}
          </div>
        </div>
    </div>
  )
}

export default ControlImagePanel
