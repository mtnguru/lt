//import React, {useState, useEffect} from 'react';
import LineChartPanel from '../panels/Charts/LineChartPanel'
import { Box,
         Flex,
         Heading
       } from '@chakra-ui/react'

import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlPanel from '../panels/ControlPanel/ControlPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
//import {findMetric} from '../utils/metrics.js'

//import './CabinContent.scss'

function CabinContent(props) {

  return (
    <Box className="page cabin-page">
      <header>
        <Heading>Red Feather Cabin</Heading>
      </header>
      <Flex className="cabin-flex">
        <Box className="left-col" w="100%">
          <LineChartPanel  options={global.aaa.page.panels.LineChartPanel} panelId="LineChartPanel" />
          <ControlImagePanel  options={global.aaa.page.panels.ImagePanel} panelId="image-cabin" />
          {/* <ControlCabinPanel  panelId="cont_clients" /> */}
          {/* <ControlManualPanel panelId="cont_manual" /> */}
        </Box>
        <Box className="right-col" w="100%">
          <ControlPanel  options={global.aaa.page.panels.ControlPanel} panelId="control-panel" />
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Box>
      </Flex>
    </Box>
  )
}
export default CabinContent;