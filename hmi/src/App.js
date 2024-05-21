/* App.js */

import { Route, Routes } from 'react-router-dom'

import { CSSReset, Box } from '@chakra-ui/react';

import JsPage from        './pages/JsPage'
import CabinPage from     './pages/CabinPage'
import OxyPage from       './pages/OxyPage'
import LabPage from       './pages/LabPage'
import MqttPage from      './pages/MqttPage'
import MqttTstPage from   './pages/MqttTstPage'
//import Page from          './pages/Page'
//import SafirePage from    './pages/SafirePage'

import MainNavigation from './components/layout/MainNavigation'
import Footer from './panels/Footer/Footer'
import './App.scss'

function App() {
  const f = "App:App - ";
  console.log(f,'enter')
  return (
    <Box id="app" color="fg">
      <CSSReset />
      <MainNavigation />
      <Box as="main">
        <Routes>
          <Route path='/'         element={<CabinPage />}  />
          <Route path='/js'       element={<JsPage />}  />
          <Route path='/cabin'    element={<CabinPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/mqtt-tst' element={<MqttTstPage />}  />
          <Route path='/oxy'      element={<OxyPage />}  />
          <Route path='/lab'      element={<LabPage />}  />
          {/*
            <Route path='/safire'   element={<SafirePage />}  />
          */}
          <Route path='/cabin'    element={<CabinPage />}  />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
