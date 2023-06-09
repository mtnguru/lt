import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlPanel from '../panels/ControlPanel/ControlPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Container,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

import './ExptPage.scss'

function ExptPage() {
  return (
    <Container className="page expt-page">
      <header>
        <Heading>Experiment - Red Feather Cabin</Heading>
      </header>
      <Flex className="expt-flex">
        <Container className="left-col">
          <ControlImagePanel panelId="image_cabin" />
          <ControlPanel      panelId="cont_clients" />
        </Container>
        <MsgPanel  classC="right-col" panelId="msg_chat" />
      </Flex>
    </Container>
  )
}
export default ExptPage;