import React, {useState} from 'react'
import { Route, Routes } from 'react-router-dom'

import PlayerPage from  './pages/PlayerPage'
import MqttPage from    './pages/MqttPage'
import AdminPage from   './pages/AdminPage'

import Welcome from './components/popup/Welcome'
import { ChakraProvider } from '@chakra-ui/react'

import MainNavigation from './components/layout/MainNavigation'
//import Footer from './panels/Footer/Footer'

function App() {
  const f = "App:App - ";
  console.log(f,'enter')

  const [welcomeOpen, setWelcomeOpen] = useState(false)

  const onClose = () => {
    setWelcomeOpen(false)
  }

  return (
    <ChakraProvider>
      <div id="app">
        {welcomeOpen && <Welcome onClose={onClose}/>}
        <MainNavigation />
        <main>
          <Routes>
            <Route path='/'         element={<PlayerPage />}  />
            <Route path='/mqtt'     element={<MqttPage />}  />
            <Route path='/admin'    element={<AdminPage />} />
            <Route path='/player'   element={<PlayerPage />}   />
          </Routes>
        </main>
        { /* <Footer/> */ }
      </div>
    </ChakraProvider>
  );
}


export default App;
