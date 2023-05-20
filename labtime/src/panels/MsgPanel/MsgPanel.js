// File: MsgPanel.js

import { Accordion } from '@chakra-ui/react'

import MsgPane from './MsgPane'
import "./MsgPanel.scss";

const MsgPanel = (props) => {
  return (
    <Accordion id='msg-panel'>
      <MsgPane paneId="Chat"></MsgPane>
      <MsgPane paneId="Notes"></MsgPane>
    </Accordion>
  )
}

export default MsgPanel