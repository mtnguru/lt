//import React, {useState, useEffect} from 'react';
import React, {useEffect, useState} from 'react';
import {AccordionItem,
        Button} from '@chakra-ui/react'
import MsgHeader from './MsgHeader'
import MsgList from './MsgList'
import {mqttPublish, mqttRegisterTopicCB} from '../../utils/mqttReact'
import {currentDate} from "../../utils/tools";

const MsgPane = (props) => {
  const [msg, setMsg] = React.useState('')
  const [list, setList] = useState([])
//var paneId = props.paneId.toLowerCase()
  var paneId = props.paneId

  const topicCB = (topic, payload) => {
    console.log("Shazam " + payload.type)
    var date = currentDate("short");
    var key = Math.random().toString(16).slice(3)
    console.log("received " + payload.msg)
    var m = payload.msg.replace(/\n/g, '<br>')
    var lines = payload.msg.split("\n")
    for (var line in lines) {
      if (lines[line].length === 0) {
        lines[line] = '\u00A0';
      }
    }
    console.log("after " + m)
    var item = {key, msg: lines, author: payload.author, date: date}

    setList((prevList) => {
//    if (prevList.length > 4000) {
//      prevList = prevList.slice(1,3500)
//      setFilteredList (() => {
//        return prevList.filter(validMsg);
//      })
//    }
      return (prevList) ? [item, ...prevList] : [item]
    })
  }

  useEffect(() => {
    mqttRegisterTopicCB("rf/msg/all", topicCB, { type: paneId })
    //Runs only on the first render
  }, []);

  // Whem the click button is pressed - submit a new item
  const clickH = (event) => {
    const topic = "rf/msg/all"
    if (msg.length === 0) return;
    event.preventDefault();
    var cdate = currentDate("full")
    var paneId = props.paneId
    var m = msg.replace(/\n/g, "\\n")
    const payload = `{"type":"${paneId}", "author":"James", "date":"${cdate}", "msg":"${m}"}`

    mqttPublish(topic, payload)
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
      <textarea onChange={onChangeH} className="msg"/>
      <MsgList className="msg-list" pretty={pretty} list={list}></MsgList>
    </AccordionItem>
  )
}

export default MsgPane