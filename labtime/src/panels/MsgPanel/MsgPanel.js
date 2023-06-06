// File: MsgPanel.js

import { Accordion } from '@chakra-ui/react'

import MsgPane from './MsgPane'
import "./MsgPanel.scss";

const MsgPanel = (props) => {
  return (
    <Accordion id='msg-panel' className={props.classC}>
      <MsgPane paneId="Chat"></MsgPane>
      <MsgPane paneId="Notes"></MsgPane>
      <MsgPane paneId="Notifications"></MsgPane>
    </Accordion>
  )
}

export default MsgPanel