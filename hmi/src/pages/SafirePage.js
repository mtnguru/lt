import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlSafirePanel from '../panels/ControlPanel/ControlSafirePanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Container,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

import './SafirePage.scss'

function SafirePage() {
  return (
    <Container className="page safire-page">
      <header>
        <Heading>SAFIRE Lab</Heading>
      </header>
      <Flex className="flex-left">
        <Container className="left-col">
          <ControlSafirePanel   panelId="reactor1" />
          <ControlImagePanel    panelId="image_cabin" />
        </Container>
        <MsgPanel  classC="right-col" panelId="msg_chat" />
      </Flex>
    </Container>
  )
}
export default SafirePage;
