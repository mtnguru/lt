import React from 'react'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import {BrowserRouter} from 'react-router-dom'
import theme from './theme/theme.ts'
import seedrandom from 'seedrandom'

const clientId = "hmi"
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3,7)}`
const userId = `user_${generator().toString(16).slice(0,6)}`

const f = "index::main - "

global.aaa = {
  clientId: clientId,
  mqttClientId: mqttClientId,
  userId: userId,
  started: false,
  startTime: Date.now(),
  status: {
    debugLevel: 0,
    enabled: 1,
    mqttConnected: 0,
    mqttSubscribe: 0,
    mqttUnsubscribe: 0,
  }
}
try {
  console.log(f, 'enter')
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <BrowserRouter>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </BrowserRouter>
  );
} catch(err) {
  console.log(f, '  Error:', err)
}