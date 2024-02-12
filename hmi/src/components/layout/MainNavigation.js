import * as React from "react";
import {useEffect, useState} from 'react'
import { Link } from "react-router-dom";
import './MainNavigation.scss';
import {mqttRegisterMqttStatusCB} from '../../utils/mqttReact'

function MainNavigation() {

  const [mqttStatus, setMqttStatus] = useState('unknown')

  useEffect(() => {
    mqttRegisterMqttStatusCB(statusCB)
  }, [] );

  const statusCB = (status) => {
    setMqttStatus(status)
    if (status === 'message') {
      setTimeout(() => {
//      if (mqttStatus === 'message') {
          setMqttStatus('connected')
//      }
      },350)
    } else {
    }
  }

  return (
    <header className='main-nav'>
      <div className='logo'><h2>LabTime</h2></div>
      <nav>
        <ul className="mqttStatus">
          <li key="oxy" className="oxy"><Link to='/oxy'>Oxy</Link></li>
          <li key="safire" className="safire"><Link to='/safire'>Safire</Link></li>
          <li key="cabin" className="cabin"><Link to='/cabin'>Cabin</Link></li>
          <li key="mqtt-lt"  className="mqtt"><Link to='/mqtt'>MQTT</Link></li>
          <li key="mqtt-tst" className="mqtt"><Link to='/mqtt-tst'>MQTT-Tst</Link></li>
          <li key="status" className={`status ${mqttStatus}`}><span>{mqttStatus}</span></li>
        </ul>
      </nav>
    </header>
  )
}

export default MainNavigation;