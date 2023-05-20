//import React, {useState, useEffect} from 'react';
import React from 'react';
//import { Container } from '@chakra-ui/react'
import { AccordionItem } from '@chakra-ui/react'
import MsgHeader from './MsgHeader'
import MsgSubmit from './MsgSubmit'
import MsgList from './MsgList'

const MsgPane = (props) => {
  return (
    <AccordionItem className={`msg-pane ${props.paneId}`}>
      <MsgHeader name={props.paneId} type={props.type}></MsgHeader>
      <MsgSubmit></MsgSubmit>
      <MsgList></MsgList>
    </AccordionItem>
  )
}

export default MsgPane