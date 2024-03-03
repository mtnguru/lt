//import React, {useState, useEffect} from 'react';
import LineChartPanel from '../panels/Charts/LineChartPanel'
import { Box,
         Flex,
//       Box,
//       Spacer,
         Heading
       } from '@chakra-ui/react'

import MqttManager from '../MqttManager'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import ControlImagePanel from '../panels/ControlPanel/ControlImagePanel'
//import {findMetric} from '../utils/metrics.js'

//import './CabinPage.scss'

const metricIds = [
  'Bathroom_Door_K_F',
  'Middle_Window_K_F',
  'Master_Door_OW_F',
  'Desk_Top_OW_F',
  'Desk_Monitor_OW_F',
]

function Page() {
//const [pageConf, setPageConf] = useState({})

  /*
  useEffect(() => {
    pageConf = global.aaa.
  }, [])
  */

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
            <LineChartPanel  projectId="cb" metricIds={metricIds} actionId="inp" valueId="value" panelId="cont_chart" />

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
export default Page;
