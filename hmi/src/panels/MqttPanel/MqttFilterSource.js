import React, { useEffect, useState } from 'react'

import { Heading, Box } from '@chakra-ui/react'

import CheckboxList from "../../components/ui/CheckboxList";

import "./MqttFilterSource.scss";

const lsKey = "ltFilterSource"

function MqttFilterSource(props) {

  const [allSelected, setAllSelected] = useState(false)

  useEffect(() => {
    const f = "MqttFilterSource::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) { // if local storage already exists
      ls = JSON.parse(lsstr)
      for (let type in global.aaa.sourceIds) {  // copy selected values into global records
        const selected = (ls[type]) ? ls[type].selected : true;
        global.aaa.sourceIds[type].selected = selected
      }
    } else {
      ls = {};
      for (let type in global.aaa.sourceIds) {
        console.log(f, 'initialize localStorage ', type)
        if (!ls[type]) ls[type] = {}
        ls[type].selected = true
        global.aaa.sourceIds[type].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    setAllSelected(global.aaa.sourceIds.all.selected)
    console.log(f, 'exit', ls)
//}, [global.aaa.mqttConnected])
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterSource::onChangeH',event.target.checked)
    global.aaa.sourceIds[event.target.id]['selected'] = event.target.checked

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
    <Box className={`mqtt-filter-source filters ${props.show ? "show" : ""}`}>
      <Heading as="h3">Source</Heading>
      <Box className={`select mqtt-source-bg ${allSelected ? "all-selected" : ""}`}>
        <CheckboxList list={(global.aaa.sourceIds) ? global.aaa.sourceIds : {}} onChangeH={onChangeH} />
      </Box>
    </Box>
  );
}

export default MqttFilterSource