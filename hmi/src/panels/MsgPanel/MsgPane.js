//import React, {useState, useEffect} from 'react';
import React, {useEffect, useState, useRef} from 'react';
import {AccordionItem,
        Button} from '@chakra-ui/react'
import MsgHeader from './MsgHeader'
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

  useEffect(() => {
    mqttRegisterTopicCB(global.aaa.topics.register.msg, topicCB, { type: paneId })
    //Runs only on the first render
  }, [paneId]);

  // Whem the click button is pressed - submit a new item
  const clickH = (event) => {
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

//function jsonEscape(str)  {
//  return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
//}
  const onChangeH = (event) => {
    setMsg(event.target.value)
  }

  const pretty = 'pretty'


  return (
    <AccordionItem className={`msg-pane ${paneId}`}>
      {paneId !== "Notifications" &&
        <Button onClick={clickH} className="msg-submit">Submit</Button>}
      <MsgHeader name={props.paneId} type={props.type}></MsgHeader>
      <textarea onChange={onChangeH} className="msg" ref={ref}/>
      <MsgList className="msg-list" pretty={pretty} list={list}></MsgList>
    </AccordionItem>
  )
}

export default MsgPane