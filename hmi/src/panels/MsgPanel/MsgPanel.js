// File: MsgPanel.js

import { Accordion } from '@chakra-ui/react'

import MsgPane from './MsgPane'
import "./MsgPanel.scss";

const MsgPanel = (props) => {
  return (
    <Accordion defaultIndex={[0]} id='msg-panel' className={props.classC} allowMultiple>
      <MsgPane paneId="Notes"></MsgPane>
      <MsgPane paneId="Chat"></MsgPane>
      <MsgPane paneId="Notify"></MsgPane>
    </Accordion>
  )
}

export default MsgPanel
