// File: MqttPanel.js

import React, {useState} from 'react';


import MqttFilterFunc from './MqttFilterFunc';
import MqttFilterClient from './MqttFilterClient';
import MqttDisplayActions from './MqttDisplayActions';
import MqttList from './MqttList';
import {mqttRegisterTopicCB} from "../../utils/mqttReact";
import {currentDate} from "../../utils/tools";

import "./MqttPanel.scss";

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

  const topicCB = (_topic, _payload) => {
//  const f = "MqttPanel::topicCB - "
//  if (_topic.indexOf('a/cmd') > -1) return;
    const dateStr = currentDate()
    const [project, func, clientId] = _topic.split('/')
    let rnd = Math.random().toString(16).slice(3)
    let key = `${clientId}-${dateStr}-${rnd}`
//  console.log("nitems ", nitems, ni);
    let item = { key, date: dateStr, project, func, clientId, topic:_topic, payload:_payload, nitems: ni }

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
    mqttRegisterTopicCB(global.aaa.topics.subscribe.prj, topicCB)
    mqttRegisterTopicCB(global.aaa.topics.subscribe.adm, topicCB)
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
    if (global.aaa.funcIds.all.selected) {
    } else {
      if (global.aaa.funcIds[func] && !global.aaa.funcIds[func].selected) {
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

  const onFilterFuncChangeH = event => {
    console.log('======================== onFilterFuncChangedH',event.target.id)
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
          <MqttFilterFunc onChangeH={onFilterFuncChangeH} />
        </div>
        <div className="mqtt-display">
          <MqttDisplayActions actions={{onClearList, onPretty}} pretty={pretty}></MqttDisplayActions>
          <MqttList className="mqtt-clientId-bg" pretty={pretty} list={filteredList}></MqttList>
        </div>
      </div>
    </div>
  )
}

export default MqttPanel
