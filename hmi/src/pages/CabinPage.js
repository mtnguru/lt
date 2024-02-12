import MqttManager from '../MqttManager'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlCabinPanel from '../panels/ControlPanel/ControlCabinPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import ControlManualPanel from '../panels/ControlPanel/ControlManualPanel'
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
      url="labtime.org:8084"
      username="data"
      password="datawp"
      projectId="cb"
      clientId="hmi-cb"
      type="hmi"
      pageId="cb">
      <Box className="page cabin-page">
        <header>
          <Heading>Red Feather</Heading>
        </header>
        <Flex className="cabin-flex">
          <Box className="left-col">
            <ControlImagePanel  panelId="image_cabin" />
            <ControlCabinPanel  panelId="cont_clients" />
            <ControlManualPanel panelId="cont_manual" />
          </Box>
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Flex>
      </Box>
    </MqttManager>
  )
}
export default CabinPage;