import React, {useEffect, useState} from 'react'

import { Box,
         Heading,
       } from '@chakra-ui/react'
//import { SettingsIcon } from '@chakra-ui/icons'

import "./MqttFilterClient.scss";
//import "../../chakra.scss";
import MqttClientList from "./MqttClientList";

const lsKey = "cnFilterClient"

function MqttFilterClient(props) {

  const [allSelected, setAllSelected] = useState(true)

  useEffect(() => {
    const f = "MqttFilterClient::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) {
      ls = JSON.parse(lsstr)
      for (let clientId in global.aaa.clients) {
        global.aaa.clients[clientId].selected = (ls[clientId]) ? ls[clientId].selected : true
      }
    } else {
      ls = {};
      for (let clientId in global.aaa.clients) {
        console.log(f, 'initialize localStorage ', clientId)
        if (!ls[clientId]) ls[clientId] = {}
        ls[clientId].selected = true
        global.aaa.clients[clientId].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    setAllSelected(global.aaa.clients.all.selected)
    console.log(f, 'exit', ls)
//}, [global.aaa.mqttConnected])
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterClient::onChangeH',event.target.checked)
    global.aaa.clients[event.target.id]['selected'] = event.target.checked

    if (event.target.id === 'all') {
      setAllSelected(event.target.checked)
    }
    let ls = JSON.parse(localStorage.getItem(lsKey))
    if (!ls[event.target.id]) {
      ls[event.target.id] = {}
    }
    ls[event.target.id]['selected'] = event.target.checked
    localStorage.setItem(lsKey, JSON.stringify(ls))

    props.onChangeH(event);
  }

  return (
    <Box className="mqtt-filter-client filters">
      <div>
        <Heading as="h3">Client</Heading>
      </div>
      <Box className={`select mqtt-clientId-bg ${allSelected ? "all-selected" : ""}`}>
        <MqttClientList list={(global.aaa.clients) ? global.aaa.clients : {}} onChangeH={onChangeH} />
      </Box>
    </Box>
  );
}

export default MqttFilterClient