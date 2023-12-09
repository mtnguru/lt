import MqttManager from '../MqttManager'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlArduinoPanel from '../panels/ControlPanel/ControlArduinoPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import { Box,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

//import './CabinPage.scss'

function CabinPage() {
  return (
    <MqttManager
      url="labtime.org"
      username="data"
      password="datawp"
      projectId="cb"
      type="hmi"
      pageId="cb">
      <Box className="page cabin-page">
        <header>
          <Heading>Experiment - Red Feather Cabin</Heading>
        </header>
        <Flex className="cabin-flex">
          <Box className="left-col">
            <ControlImagePanel panelId="image_cabin" />
            <ControlArduinoPanel      panelId="cont_clients" />
          </Box>
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Flex>
      </Box>
    </MqttManager>
  )
}
export default CabinPage;
