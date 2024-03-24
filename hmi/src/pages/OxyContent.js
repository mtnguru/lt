//import React, {useState, useEffect} from 'react';
import { Box,
         Flex,
         Heading
       } from '@chakra-ui/react'

import LineChartPanel from '../panels/Charts/LineChartPanel'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlPanel from '../panels/ControlPanel/ControlPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
//import {findMetric} from '../utils/metrics.js'

//import './OxyContent.scss'

function OxyContent(props) {

  return (
    <Box className="page cabin-page">
      <header>
        <Heading>Swiss Oxyhydrogen Energy</Heading>
      </header>
      <Flex className="oxy-flex">
        <Box className="left-col" w="100%">
          <LineChartPanel  options={global.aaa.page.panels.LineChartPanel} panelId="LineChartPanel" />
          <ControlImagePanel  options={global.aaa.page.panels.ImagePanel} panelId="image-cabin" />
        </Box>
        <Box className="right-col" w="100%">
          <ControlPanel  options={global.aaa.page.panels.ControlPanel} panelId="control-panel" />
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Box>
      </Flex>
    </Box>
  )
}
export default OxyContent;