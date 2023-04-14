// File: MsgPanel.js

// import React, {useState} from 'react';

import MsgPane from './MsgPane'
import { Accordion } from '@chakra-ui/react'
import "./MsgPanel.scss";

const MsgPanel = (props) => {
  return (
    <Accordion id='msg-panel'>
      shot
      <MsgPane name="Chat"></MsgPane>
      <MsgPane name="Questions"></MsgPane>
      <MsgPane name="Polls"></MsgPane>
    </Accordion>
  )
}

export default MsgPanel
