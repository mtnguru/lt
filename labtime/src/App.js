import React, {useState} from 'react'
import { Route, Routes } from 'react-router-dom'

import { Container } from '@chakra-ui/react'
import ExptPage from    './pages/ExptPage'
import MqttPage from    './pages/MqttPage'
import AdminPage from   './pages/AdminPage'

import Welcome from './components/popup/Welcome'

import './App.scss'
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
    <Container id="app">
      {welcomeOpen && <Welcome onClose={onClose}/>}
      <MainNavigation />
      <Container as="main">
        <Routes>
          <Route path='/'         element={<MqttPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/expt'     element={<ExptPage />}  />
          <Route path='/admin'    element={<AdminPage />} />
        </Routes>
      </Container>
      <Footer />
    </Container>
  );
}


export default App;