//import React, {useState, useEffect} from 'react';
import React from 'react';
//import { Container } from '@chakra-ui/react'
import { AccordionItem } from '@chakra-ui/react'
import MsgHeader from './MsgHeader'
import MsgAdd from './MsgAdd'
import MsgList from './MsgList'

const MsgPane = (props) => {
  return (
    <AccordionItem id='msg-pane'>
      <MsgHeader name={props.name} type={props.type}></MsgHeader>
      <MsgAdd></MsgAdd>
      <MsgList></MsgList>
    </AccordionItem>
  )
}

export default MsgPane
