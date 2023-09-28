import React, {useState} from 'react'
import { Route, Routes } from 'react-router-dom'

import { Box } from '@chakra-ui/react'
import CabinPage from   './pages/CabinPage'
////import SafirePage from  './pages/SafirePage'
import OxyPage from     './pages/OxyPage'
import MqttPage from    './pages/MqttPage'
import AdminPage from   './pages/AdminPage'

import Welcome from './components/popup/Welcome'

//import './App.scss'
import MainNavigation from './components/layout/MainNavigation'
import Footer from './panels/Footer/Footer'

function App() {
  const f = "App:App - ";
  console.log(f,'enter')

  const [welcomeOpen, setWelcomeOpen] = useState(false)

  const onClose = () => {
    setWelcomeOpen(false)
  }

  return (
    <Box id="app" bg="bg" color="fg">
      {welcomeOpen && <Welcome onClose={onClose}/>}
      <MainNavigation />
      <Box as="main">
        <Routes>
          <Route path='/'         element={<OxyPage />}  />
          <Route path='/oxy'      element={<OxyPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          {/*<Route path='/safire'   element={<SafirePage />}  /> */}
          <Route path='/cabin'    element={<CabinPage />}  />
          <Route path='/admin'    element={<AdminPage />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
