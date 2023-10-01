import React, {useEffect, useState, useRef} from 'react';
import {
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Box,
  Heading,
  Textarea,
  //Button
} from '@chakra-ui/react'
import { Resizable } from 're-resizable'
import MsgList from './MsgList'
import {mqttPublish, mqttRegisterTopicCB} from '../../utils/mqttReact'
import {currentDate} from "../../utils/tools";

const MsgPane = (props) => {
  const [msg, setMsg] =   useState('')
  const [list, setList] = useState([])
  const ref = useRef(null)
//var paneId = props.paneId.toLowerCase()
  var paneId = props.paneId

  const topicCB = (_topic, _payload) => {
    console.log("Shazam " + _payload.type)
    var date = currentDate("short");
    var key = Math.random().toString(16).slice(3)
    console.log("received " + _payload.msg)
    var m = _payload.msg.replace(/\n/g, '<br>')
    var lines = _payload.msg.split("\n")
    for (var line in lines) {
      if (lines[line].length === 0) {
        lines[line] = '\u00A0';
      }
    }
    console.log("after " + m)
    var item = {key, msg: lines, author: _payload.author, date: date}

    setList((prevList) => {
      return (prevList) ? [item, ...prevList] : [item]
    })
  }

  const topicCBRef = useRef(topicCB)

  useEffect(() => {
    mqttRegisterTopicCB(global.aaa.topics.register.msg, topicCBRef.current, {type: paneId })
  }, [paneId]);

  // Submit button pressed
  /*
  const clickH = (event) => {
    submitMsg(event)
  }
   */

  const onKeyH = (event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
      submitMsg(event)
    }
  }

  const onChangeH = (event) => {
    setMsg(event.target.value)
  }

  const submitMsg = (event) => {
    const topic = global.aaa.topics.publish['msg']
    if (msg.length === 0) return;
    event.preventDefault();
    var cdate = currentDate("full")
    var paneId = props.paneId
    var m = msg.replace(/\n/g, "\\n")
    const payload = `{"type":"${paneId}", "author":"James", "date":"${cdate}", "msg":"${m}"}`

    mqttPublish(topic, payload)
//  setMsg('')
    ref.current.value = '';
    console.log(payload)
  }

  const pretty = 'pretty'

  return (
    <AccordionItem className={`msg-pane ${paneId}`}>
      {/*paneId !== "Notifications" &&
      <Button onClick={clickH} size="xsm" className="msg-submit">Submit</Button>*/}
      <AccordionButton pb={0} pt={0}>
        <Box as="span" flex='1' textAlign='left'>
          <Heading as="h3" fg="titleFg" color="titleFg" fontSize="130%" className="msg-header-name">{paneId}</Heading>
        </Box>
        <AccordionIcon width="30px" height="30px"/>
      </AccordionButton>
        <AccordionPanel pt={0} pb={2}>
          {props.paneId !== 'Notifications' &&
            <Textarea p="10px" mb={2} bg="bg4" minH="30px" onChange ={onChangeH} onKeyDown={onKeyH} className="msg" ref={ref}/>}
          <MsgList className="msg-list" pretty={pretty} list={list}></MsgList>
        </AccordionPanel>
    </AccordionItem>
  )
}
/*
<Resizable
  width="100%"
  height="30%"
  handleStyles = {{
    right: { zIndex: 1 },
    bottom: { zIndex: 1 },
    bottomRight: { zIndex: 1 },
  }}
>
  <AccordionPanel pt={0} pb={2}>
    {props.paneId !== 'Notifications' &&
      <Textarea p="10px" mb={2} bg="bg4" minH="30px" onChange ={onChangeH} onKeyDown={onKeyH} className="msg" ref={ref}/>}
    <MsgList className="msg-list" pretty={pretty} list={list}></MsgList>
  </AccordionPanel>
</Resizable>
 */

export default MsgPane