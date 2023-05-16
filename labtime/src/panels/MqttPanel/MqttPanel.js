// File: MqttPanel.js

import React, {useState} from 'react';


import MqttFilterFunc from './MqttFilterFunc';
import MqttFilterClient from './MqttFilterClient';
import MqttDisplayActions from './MqttDisplayActions';
import MqttList from './MqttList';
import "./MqttPanel.scss";
import {mqttRegisterTopicCB} from "../../utils/mqttReact";

let registered = false;

const MqttPanel = (props) => {

  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [nitems, setNItems] = useState(0);
  const [pretty, setPretty] = useState("pretty")
  let ni = 0

  const onClearList = (event) => {
    console.log('Clear List button pressed', event.target.value)
    setList(() => {
      ni = 0
      setNItems(() => {return 0})
      return []
    })
    setFilteredList(applyFilters(list))
  }

  const onPretty = (event) => {
    setPretty(event.target.value);
  }

  const mqttCB = (topic, payload) => {
//  const f = "MqttPanel::mqttCB - "
    const time = Date.now();
    const date = new Date(time);
    const dateStr =
//    date.getFullYear() + '-' +
//    ('0' + (date.getMonth()+1)).slice(-2) + '-' +
//    ('0' + date.getDate()).slice(-2) + ' ' +
      date.getHours()+ ':'+
      ('0' + date.getMinutes()).slice(-2)+ ':' +
      ('0' + date.getSeconds()).slice(-2)+ ' - ' +
      ('00' + date.getMilliseconds()).slice(-3)

    const [project, func, clientId] = topic.split('/')
    let rnd = Math.random().toString(16).slice(3)
    let key = `${clientId}-${time.toString()}-${rnd})}`
    if (nitems) {
    }
//  console.log("nitems ", nitems, ni);
    let item = { key, date: dateStr, project, func, clientId, topic, payload, nitems: ni }

    setNItems((prevNItems) => {
      return ni = prevNItems + 1
    })

    setList((prevList) => {
      if (prevList.length > 4000) {
        prevList = prevList.slice(1,3500)
        setFilteredList (() => {
          return prevList.filter(validMsg);
        })
      }
      return (prevList) ? [item, ...prevList] : [item]
    })

    // Add the item to the filtered list
    if (validMsg(item)) {
      setFilteredList((prevFilteredList) => {
        return (prevFilteredList) ? [item, ...prevFilteredList] : [item]
      })
    }
  }

  if (!registered) {
    registered = true;
    for (let n in global.aaa.topics.subscribe) {
      mqttRegisterTopicCB(global.aaa.topics.subscribe[n], mqttCB)
    }
  }

  /**
   * validMsg() - Compare to client and func filters
   * @param item
   * @returns {boolean}
   */
  const validMsg = (item) => {
    const [,func,clientId] = item.topic.split('/')
    if (global.aaa.clients.all.selected) {
    } else {
      if (global.aaa.clients[clientId] && !global.aaa.clients[clientId].selected) {
        return false;
      }
    }
    if (global.aaa.msgTypes.all.selected) {
    } else {
      if (global.aaa.msgTypes[func] && !global.aaa.msgTypes[func].selected) {
        return false;
      }
    }
    return true;
  }

  const applyFilters = () => {
    setFilteredList (() => {
      return list.filter(validMsg);
    })
  }

  const onFilterTypeChangeH = event => {
    console.log('======================== onFilterTypeChangedH',event.target.id)
    applyFilters(list)
  }

  const onFilterClientChangeH = event => {
    console.log('======================== onFilterClientChangedH',event.target.id)
    applyFilters(list)

  }

  return (
    <div className="panel mqtt-panel">
      <h2>{props.title}</h2>
      <div className="content">
        <div className='filters'>
          <MqttFilterClient onChangeH={onFilterClientChangeH} />
          <MqttFilterFunc onChangeH={onFilterTypeChangeH} />
        </div>
        <div className="mqtt-display">
          <MqttDisplayActions actions={{onClearList, onPretty}} pretty={pretty}></MqttDisplayActions>
          <MqttList className="mqtt-client-bg" pretty={pretty} list={filteredList}></MqttList>
        </div>
      </div>
    </div>
  )
}

export default MqttPanel
