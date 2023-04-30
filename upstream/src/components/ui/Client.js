import React from 'react'
import './Client.scss'
import ControlButton from '../../panels/ControlPanel/ControlButton.js';
import SelectDebugLevel from './SelectDebugLevel.js';

import {mgDebug} from "../../utils/mg"
import {mqttPublish} from "../../utils/mqttReact"

function Client (props) {
  const selectH = (event) => {
    let topic = 'lab1/admin/debugLevel/' + props.name
    let payload = event.target.value;
    console.log('   send ', topic, payload)
    mqttPublish(topic, payload)
    return;
  }

  const clickH = (event) => {
    const f = "ControlButton::clickH"
    const name = event.target.innerText;
    mgDebug(f,'Button pressed',name)
    let topic;
    let payload;
    if (name === "R") {
      topic = 'lab1/admin/reset/' + props.name
      payload = ''
    } else if (name === "S") {
      topic = 'lab1/admin/status/' + props.name
      payload = ''
    } else {
      console.log('   unknown button pressed ', name, '');
      return;
    }

    console.log('   send ', topic, payload)
    mqttPublish(topic, payload)
  }

  return (
    <div className={`checkbox ${props.id}`} key={`${props.id}`}>
      <div className="row1">
        <input id={props.id} type='checkbox' name={props.id} onChange={props.onChangeH} checked={props.selected ? "checked" : ""} />
        <label htmlFor={props.id}>{props.name}</label>
      </div>
      {props.id !== 'all' &&
        <div className="row2">
          <ControlButton id={props.name} client={props.name} title="Reset"  label="R" cname="reset"
                         clickH={clickH}></ControlButton>
          <ControlButton id={props.name} client={props.name} title="Status" label="S" cname="status"
                         clickH={clickH}></ControlButton>
          <SelectDebugLevel id={props.name} client={props.name} title="Debug Level" label={""} cname="debug-level"
                  onChangeH={selectH} />
        </div>
      }
    </div> )
}
export default Client;

