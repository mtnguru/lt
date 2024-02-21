//import React, {useState, useEffect} from 'react';
import LineChart from '../panels/Charts/LineChart'
import { Box,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

import MqttManager from '../MqttManager'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
//import ControlCabinPanel from '../panels/ControlPanel/ControlCabinPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
//import {findMetric} from '../utils/metrics.js'

//import './CabinPage.scss'

function CabinPage() {

  const metricIds = [
    'Bathroom_Door_K_F',
    'Middle_Window_K_F',
    'Master_Door_OW_F',
    'Desk_Top_OW_F',
    'Desk_Monitor_OW_F',
  ]

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
            <LineChart  projectId="cb" metricIds={metricIds} sourceId="inp" valueId="value" panelId="cont_chart" />

            <ControlImagePanel  panelId="image_cabin" />
            {/* <ControlCabinPanel  panelId="cont_clients" /> */}
            {/* <ControlManualPanel panelId="cont_manual" /> */}
          </Box>
          <MsgPanel  classC="right-col" panelId="msg_chat" />
        </Flex>
      </Box>
    </MqttManager>
  )
}
export default CabinPage;