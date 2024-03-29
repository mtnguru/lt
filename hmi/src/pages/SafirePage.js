import MqttManager from '../MqttManager'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlSafirePanel from '../panels/ControlPanel/ControlSafirePanel'
//import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
import {
  Container,
  Flex,
} from '@chakra-ui/react'

import './SafirePage.scss'

function SafirePage() {
  return (
    <MqttManager
      url="labtime.org"
      username="data"
      password="datawp"
      projectId="sl"
      type="hmi"
      clientId="hmi-oxy"
      pageId="sl">

      <Flex w="100%" className="page safire-page flex">
        <Container className="left-col">
          <ControlSafirePanel   panelId="R1" />
          {/*<ControlImagePanel    panelId="image_cabin" />*/}
        </Container>
        <MsgPanel  classC="right-col" />
      </Flex>
    </MqttManager>
  )
}
export default SafirePage;
