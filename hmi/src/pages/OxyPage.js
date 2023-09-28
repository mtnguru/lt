import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlOxyPanel from '../panels/ControlPanel/ControlOxyPanel'
//import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Box,
         Flex,
         Container,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

import './OxyPage.scss'

function OxyPage() {
  return (
    <Box className="page oxy-page" w="100%" >
      <Flex className="flex">
        <Container className="left-col">
          <ControlOxyPanel   panelId="reactor1" />
          {/*<ControlImagePanel    panelId="image_cabin" />*/}
        </Container>
        <MsgPanel  classC="right-col" panelId="msg_chat" />
      </Flex>
    </Box>
  )
}
export default OxyPage;