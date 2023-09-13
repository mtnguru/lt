// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'

import ControlMetric from './ControlMetric'
// import ControlBar from './ControlBar'

import { Container,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

import './ControlArduinoPanel.scss'

const ControlArduinoPanel = (props) => {
  const clickH = (event) => {
    console.log('clickH', event.target);
  }

  return (
    <Container className="panel control-arduino-panel mqtt-clientId-bg">
      <h2>Control panel</h2>
      <Container className="control-flex">
        <div className="controls">
          <div className="control-bar arduino2">
            <label className="label">Arduino2</label>
            <ControlButton clientId="arduino2" metricId="arduino2_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton clientId="arduino2" metricId="arduino2_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino3">
            <label className="label">Arduino3</label>
            <ControlButton clientId="arduino3" metricId="arduino3_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton clientId="arduino3" metricId="arduino3_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino4">
            <label className="label">Arduino4</label>
            <ControlButton clientId="arduino4" metricId="arduino4_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton clientId="arduino4" metricId="arduino4_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino5">
            <label className="label">Arduino5</label>
            <ControlButton clientId="arduino5" metricId="arduino5_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton clientId="arduino5" metricId="arduino5_LED_Onboard_On" type="toggle" label="Onboard LED" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar epiclc">
            <label className="label">EpicLC</label>
            <ControlButton clientId="epiclc" metricId="reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>

            <ControlButton clientId="epiclc" metricId="Backpanel_LED_Blue_On" type="toggle" cname="blue" label="Blue" clickH={clickH}></ControlButton>
            <ControlButton clientId="epiclc" metricId="Backpanel_LED_Green_On" type="toggle" cname="green" label="Green" clickH={clickH}></ControlButton>
            <ControlButton clientId="epiclc" metricId="Backpanel_LED_Red_On" type="toggle" cname="red" label="Red" clickH={clickH}></ControlButton>
          </div>
        </div>
      </Container>

      <Container>
        <div className="metrics">
          <ControlMetric metricId="Outside_Bunkhouse_K_F" type="status" label="Outdoors" cname=""></ControlMetric>
          <ControlMetric metricId="Outside_Front_K_F" type="status" label="Rio Outside" cname=""></ControlMetric>
        </div>
        <div className="metrics">
          <ControlMetric metricId="LivingRoom_Desk_K_F" type="status" label="Living Room" cname=""></ControlMetric>
          <ControlMetric metricId="MiddleBedroom_Window_K_F" type="status" label="Kitchen Ceiling" cname=""></ControlMetric>
        </div>
        <div className="metrics">
          <ControlMetric metricId="MasterBedroom_Door_K_F" type="status" label="Rio Bedroom" cname=""></ControlMetric>
          <ControlMetric metricId="LivingRoom_Fireplace_K_F" type="status" label="Rio Fireplace" cname=""></ControlMetric>
        </div>
      </Container>
    </Container>
  )
}

export default ControlArduinoPanel