import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlSafirePanel from '../panels/ControlPanel/ControlSafirePanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Box,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

//import './SafirePage.scss'

function SafirePage() {
  return (
    <Box className="page safire-page">
      <header>
        <Heading>SAFIRE Lab</Heading>
      </header>
      <Flex className="flex-left">
        <Box className="left-col">
          <ControlSafirePanel   panelId="reactor1" />
          <ControlImagePanel    panelId="image_cabin" />
        </Box>
        <MsgPanel  classC="right-col" panelId="msg_chat" />
      </Flex>
    </Box>
  )
}
export default SafirePage;
