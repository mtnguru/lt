//import React, {useState, useEffect} from 'react';
import LineChartPanel from '../panels/Charts/LineChartPanel'
import { Box,
         Flex,
         Heading
       } from '@chakra-ui/react'

import ControlPanel from '../panels/ControlPanel/ControlPanel'
import MsgPanel from '../panels/MsgPanel/MsgPanel'

//import './JsContent.scss'

function JsContent(props) {

  return (
    <Box className="page js-page">
      <header>
        <Heading>James Biometrics</Heading>
      </header>
      <Flex className="js-flex">
        <Box className="left-col">
          <ControlPanel       options={global.aaa.page.panels.ControlHuman} />
          <LineChartPanel     options={global.aaa.page.panels.LineChartHuman} />
        </Box>
        <Box className="right-col">
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Box>
      </Flex>
    </Box>
  )
}
export default JsContent;
