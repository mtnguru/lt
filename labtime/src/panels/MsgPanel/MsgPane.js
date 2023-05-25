//import React, {useState, useEffect} from 'react';
import React from 'react';
import {AccordionItem,
        Button} from '@chakra-ui/react'
import MsgHeader from './MsgHeader'
import MsgList from './MsgList'
import {mqttPublish} from '../../utils/mqttReact'

const MsgPane = (props) => {
  var [msg, setMsg] = React.useState('Initial')

  // Whem the click button is pressed - submit a new item
  const clickH = (event) => {
    const topic = "rf/msg/labtime"
    const payload = `{"type":"notes", "author":"James", "time":"today", "msg":"${msg}"}`
    mqttPublish(topic, payload)
    console.log(payload)
  }

  function jsonEscape(str)  {
    return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
  }
  const onChangeH = (event) => {

    setMsg(event.target.value)
  }

  return (
    <AccordionItem className={`msg-pane ${props.paneId}`}>
      <Button onClick={clickH} className="msg-submit">Submit</Button>
      <MsgHeader name={props.paneId} type={props.type}></MsgHeader>
      <textarea onChange={onChangeH} className="msg"/>
      <MsgList></MsgList>
    </AccordionItem>
  )
}

export default MsgPane