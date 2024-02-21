// File: MqttPanel.js

import React, {useState} from 'react';
import {
  Box,
  Flex,
  Button,
//Container
} from '@chakra-ui/react'

import MqttFilterSource from './MqttFilterSource';
import MqttFilterClient from './MqttFilterClient';
import MqttList from './MqttList';
import {mqttRegisterTopicCB} from "../../utils/mqttReact";
import {currentDate} from "../../utils/tools";
import {ckTopic} from "../../utils/topics"

import "./MqttPanel.scss";
import SelectPretty from "../../components/ui/SelectPretty";

let registered = false;

const MqttPanel = (props) => {

  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [nitems, setNItems] = useState(0);
  const [pretty, setPretty] = useState("pretty")
  const [showClients, setShowClients] = useState(false)
  const [showSource, setShowSource] = useState(false)
  let ni = 0

  const onClearList = (event) => {
    console.log('Clear List button pressed', event.target.value, nitems)
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
    try {
      const dateStr = currentDate()
      const [project, sourceId, clientId] = _topic.split('/')
      let rnd = Math.random().toString(16).slice(3)
      let key = `${clientId}-${dateStr}-${rnd}`
      let item = {
        key,
        date: dateStr,
        projectId: project.projectId,
        sourceId,
        clientId,
        topic: _topic,
        payload: _payload,
        nitems: ni}

      setNItems((prevNItems) => {
        return ni = prevNItems + 1
      })

      setList((prevList) => {
        if (prevList.length > 2000) {
          prevList = prevList.slice(1, 1500)
          setFilteredList(() => {
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
    } catch(err) {
      console.log("Error in MqttPanel::topicCB " + err)
    }
  }

  if (!registered) {
    registered = true;
    mqttRegisterTopicCB(ckTopic("register","all"), topicCB)
  }

  /**
   * validMsg() - Compare to client and func filters
   * @param item
   * @returns {boolean}
   */
  const validMsg = (item) => {
    const [,sourceId,clientId] = item.topic.split('/')
    if (global.aaa.clients.all.selected) {
    } else {
      if (global.aaa.clients[clientId] && !global.aaa.clients[clientId].selected) {
        return false;
      }
    }
    if (global.aaa.sourceIds.all.selected) {
    } else {
      if (global.aaa.sourceIds[sourceId] && !global.aaa.sourceIds[sourceId].selected) {
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

  const onFilterSourceChangeH = event => {
    console.log('======================== onFilterSourceChangedH',event.target.id)
    applyFilters(list)
  }

  const onFilterClientChangeH = event => {
    console.log('======================== onFilterClientChangedH',event.target.id)
    applyFilters(list)
  }

  const onSourceFilterH = event => {
    console.log('======================== onFilterClientChangedH',event.target.id)
    setShowSource(!showSource)
  }

  const onClientFilterH = event => {
    console.log('======================== onFilterClientChangedH',event.target.id)
    setShowClients(!showClients)
  }

  return (
    <div className="panel mqtt-panel">
      <Flex className="content">
        <MqttFilterClient show={showClients} onChangeH={onFilterClientChangeH} />
        <MqttFilterSource show={showSource} onChangeH={onFilterSourceChangeH} />
        <Box className="mqtt-display">
          <div className="mqtt-display-actions">
            <div className="buttons">
              <span className="actions">
                <SelectPretty onChangeH={onPretty} />
                <Button type="push" className="clear" size="sm" variant="solid" colorScheme="yellow" onClick={onClearList}>Clear</Button>
              </span>
              <span className="filter-buttons">
                <span className="filters-label">Filters</span>
                <Button className="show-source-filter" size="sm" variant="solid" colorScheme="purple" onClick={onSourceFilterH}>Source</Button>
                <Button className="show-clients-filter" size="sm" variant="solid" colorScheme="purple" onClick={onClientFilterH}>Clients</Button>
              </span>
            </div>
          </div>
          <MqttList className="mqtt-clientId-bg" pretty={pretty} list={filteredList}></MqttList>
        </Box>
      </Flex>
    </div>
  )
}

export default MqttPanel