// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'

import ControlStats from './ControlStats'
// import ControlBar from './ControlBar'

import { Container,
//       Heading,
//       IconButton
       } from '@chakra-ui/react'

import './ControlPanel.scss'

const ControlPanel = (props) => {
  const clickH = (event) => {
    console.log('clickH', event.target);
  }

  return (
    <Container className="panel control-panel mqtt-client-bg">
      <h2>Control panel</h2>
      <Container className="control-flex">
        <div className="controls">
          <div className="control-bar arduino2">
            <label className="label">Arduino2</label>
            <ControlButton client="arduino2" metricId="arduino2_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino2" metricId="arduino2_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino3">
            <label className="label">Arduino3</label>
            <ControlButton client="arduino3" metricId="arduino3_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino3" metricId="arduino3_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino4">
            <label className="label">Arduino4</label>
            <ControlButton client="arduino4" metricId="arduino4_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino4" metricId="arduino4_LED_Onboard_On" type="toggle" label="Onboard LED" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino5">
            <label className="label">Arduino5</label>
            <ControlButton client="arduino5" metricId="arduino5_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino5" metricId="arduino5_LED_Onboard_On" type="toggle" label="Onboard LED" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar epiclc">
            <label className="label">EpicLC</label>
            <ControlButton client="epiclc" metricId="reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>

            <ControlButton client="epiclc" metricId="Backpanel_LED_Blue_On" type="toggle" cname="blue" label="Blue" clickH={clickH}></ControlButton>
            <ControlButton client="epiclc" metricId="Backpanel_LED_Green_On" type="toggle" cname="green" label="Green" clickH={clickH}></ControlButton>
            <ControlButton client="epiclc" metricId="Backpanel_LED_Red_On" type="toggle" cname="red" label="Red" clickH={clickH}></ControlButton>
          </div>
        </div>
      </Container>

      <Container>
        <div className="stats">
          <ControlStats metricId="Outside_Bunkhouse_K_F" type="status" label="Outdoors" cname=""></ControlStats>
          <ControlStats metricId="Outside_Front_K_F" type="status" label="Rio Outside" cname=""></ControlStats>
        </div>
        <div className="stats">
          <ControlStats metricId="LivingRoom_Desk_K_F" type="status" label="Living Room" cname=""></ControlStats>
          <ControlStats metricId="MiddleBedroom_Window_K_F" type="status" label="Kitchen Ceiling" cname=""></ControlStats>
        </div>
        <div className="stats">
          <ControlStats metricId="MasterBedroom_Door_K_F" type="status" label="Rio Bedroom" cname=""></ControlStats>
          <ControlStats metricId="LivingRoom_Fireplace_K_F" type="status" label="Rio Fireplace" cname=""></ControlStats>
        </div>
      </Container>
    </Container>
  )
}

export default ControlPanel
