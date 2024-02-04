/* App.js */

import { Route, Routes } from 'react-router-dom'

import { CSSReset, Box } from '@chakra-ui/react';

import CabinPage from     './pages/CabinPage'
import SafirePage from    './pages/SafirePage'
import OxyPage from       './pages/OxyPage'
import MqttPage from      './pages/MqttPage'
import MqttTstPage from   './pages/MqttTstPage'

import MainNavigation from './components/layout/MainNavigation'
import Footer from './panels/Footer/Footer'
import './App.scss'

function App() {
  const f = "App:App - ";
  console.log(f,'enter')
  return (
    <Box id="app" bg="bg" color="fg">
      <CSSReset />
      <MainNavigation />
      <Box as="main">
        <Routes>
          <Route path='/'         element={<MqttPage />}  />
          <Route path='/oxy'      element={<OxyPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/mqtt-tst' element={<MqttTstPage />}  />
          <Route path='/safire'   element={<SafirePage />}  />
          <Route path='/cabin'    element={<CabinPage />}  />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
