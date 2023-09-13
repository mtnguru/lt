// File: ControlText.js
// import React, {useState} from 'react';

import ControlMetric from './ControlMetric'
//import ControlNumber from './ControlNumber'
//import ControlButton from './ControlButton'
import ControlSlider from './ControlSlider'

// import ControlBar from './ControlBar'

import { Container,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

import './ControlSafirePanel.scss'

const ControlSafirePanel = (props) => {

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const onChange = (event) => {
//  setValue(parseFloat(event.target.value).toFixed(metric.decimals))
//  const f = "ControlSafirePanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
    /*
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(0, f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.topic.publish['human'];
    let value = event.target.value;
    let payload = `${metric.human.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
    */
  }


  return (
    <Container className="panel control-safire-panel mqtt-clientId-bg">
      {/*<h2>Control panel</h2>*/}
      <Container className="controls" >
        <div className="control-bar pressure">
          <label className="label">Pressure</label>
          <ControlMetric metricId="R1_Ch_Human_PSI" type="status" label="Pressure" cname=""></ControlMetric>
          {/*<ControlNumber metricId="R1_Ch_Human_PSI" type="status" label="Pressure" cname=""></ControlNumber>*/}
          <ControlSlider clientId="hmi" metricId="R1_Ch_Human_PSI" onChange={onChange} />
          {/*<ControlButton clientId="hmi" metricId="R1_Ch_Human_PSI" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>*/}
        </div>
        <div className="control-bar voltage">
          <label className="label">Voltage</label>
          <ControlMetric metricId="R1_PS_Pico_V" type="status" label="Voltage" cname=""></ControlMetric>
        </div>
        <div className="control-bar amps">
          <label className="label">Amps</label>
          <ControlMetric metricId="R1_PS_Pico_A" type="status" label="Amps" cname=""></ControlMetric>
        </div>
        <div className="control-bar internal">
          <label className="label">Internal</label>
          <ControlMetric metricId="R1_Ch_K_Internal_C" type="status" label="Internal" cname=""></ControlMetric>
        </div>
        <div className="control-bar external">
          <label className="label">External</label>
          <ControlMetric metricId="R1_Ch_K_External_C" type="status" label="Exgternal" cname=""></ControlMetric>
        </div>
        <div className="control-bar ambient">
          <label className="label">Ambient</label>
          <ControlMetric metricId="R1_Ch_K_Ambient_C" type="status" label="Pressure" cname=""></ControlMetric>
        </div>
      </Container>
    </Container>
  )
}

export default ControlSafirePanel