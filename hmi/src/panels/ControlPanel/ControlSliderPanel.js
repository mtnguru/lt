// File: ControlText.js
// import React, {useState} from 'react';

import MetricSlider from './MetricSlider'
import Card from '../../components/ui/Card'

//import './ControlSliderPanel.scss'

const ControlSliderPanel = (props) => {
  const onChange = (event) => {
  }

  return (
    <div className="panel metric-slider">
      <h2>Simulation panel</h2>
      <div className="control-flex">
        <Card>
          <h3>Static</h3>
          <MetricSlider client="arduino2" metricId="Ch_MFC_Gas_D2_sccm" onChange={onChange} />
          <MetricSlider client="arduino2" metricId="Ch_K_TopCenter_C" onChange={onChange} />
        </Card>
        <Card>
          <h3>Variable</h3>
          <MetricSlider client="arduino2" metricId="Ch_Baratron_torr" onChange={onChange} />
          <MetricSlider client="arduino2" metricId="PS_DC_V" onChange={onChange} />
          <MetricSlider client="arduino2" metricId="Ch_MFC_Gas_N2_sccm" onChange={onChange} />
        </Card>
      </div>
    </div>
  )
}

export default ControlSliderPanel
