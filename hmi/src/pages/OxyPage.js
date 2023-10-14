import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlOxyPanel from '../panels/ControlPanel/ControlOxyPanel'
//import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Flex,
         Container
       } from '@chakra-ui/react'

import './OxyPage.scss'

function OxyPage() {
  return (
    <Flex w="100%" className="page oxy-page flex">
      <Container className="left-col">
        <ControlOxyPanel   panelId="EZ1" />
        {/*<ControlImagePanel    panelId="image_cabin" />*/}
      </Container>
      <MsgPanel  classC="right-col" panelId="msg_chat" />
    </Flex>
  )
}
export default OxyPage;