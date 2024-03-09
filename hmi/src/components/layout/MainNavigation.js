import * as React from "react";
import {useEffect, useState} from 'react'
import { Link } from "react-router-dom";
//import {mqttRegisterMqttStatusCB} from '../../utils/mqttReact'
import MqttStatus from '../ui/MqttStatus'
import './MainNavigation.scss';

function MainNavigation() {

  return (
    <header className='main-nav'>
      <div className='flex'>
        <div className='logo'><h2>LabTime</h2></div>
        <nav>
          <ul>
            <li key="lab" className="lab"><Link to='/lab'>Lab</Link></li>
            <li key="oxy" className="oxy"><Link to='/oxy'>Oxy</Link></li>
            <li key="safire" className="safire"><Link to='/safire'>Safire</Link></li>
            <li key="cabin" className="cabin"><Link to='/cabin'>Cabin</Link></li>
            <li key="mqtt-lt"  className="mqtt"><Link to='/mqtt'>MQTT</Link></li>
            <li key="mqtt-tst" className="mqtt"><Link to='/mqtt-tst'>MQTT-Tst</Link></li>
          </ul>
        </nav>
      </div>
      <MqttStatus />
    </header>
)
}

export default MainNavigation;