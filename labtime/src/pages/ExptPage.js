import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlPanel from '../panels/ControlPanel/ControlPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Container,
         Flex,
         Box,
//       Spacer,
         Heading } from '@chakra-ui/react'

function ExptPage() {
  return (
    <Container className="expt-page">
      <Box>
        <Heading>Experiment Page</Heading>
      </Box>
      <Flex>
        <Container>
          <ControlImagePanel panelId="image_cabin" />
          <ControlPanel      panelId="cont_clients" />
        </Container>
        <MsgPanel            panelId="msg_chat" />
      </Flex>
    </Container>
  )
}
export default ExptPage;