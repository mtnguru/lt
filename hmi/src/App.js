/* App.js */

import React, {useState, useEffect} from 'react';
import { useDisclosure } from "@chakra-ui/react";
import { Route, Routes } from 'react-router-dom'

import { CSSReset, Box, Button } from '@chakra-ui/react';
import UserNamePopup from './UserNamePopup';

import CabinPage from   './pages/CabinPage'
import SafirePage from  './pages/SafirePage'
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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState("ralph")

  const handleUsernameSubmit = (value) => {
    setUsername(value);
  };

  // Open the popup on startup
  React.useEffect(() => {
    onOpen();
  }, [onOpen]);

  return (
    <Box id="app" bg="bg" color="fg">

      <MainNavigation />
      <Button onClick={onOpen}>Change Username: {username}</Button>
      <Box as="main">
        <Routes>
          <Route path='/'         element={<MqttPage />}  />
          <Route path='/oxy'      element={<OxyPage />}  />
          <Route path='/mqtt'     element={<MqttPage />}  />
          <Route path='/safire'   element={<SafirePage />}  />
          <Route path='/cabin'    element={<CabinPage />}  />
        </Routes>
      </Box>
      <Footer />

      <UserNamePopup
        isOpen={isOpen}
        onClose={onClose}
        onUsernameSubmit={handleUsernameSubmit}
      />
    </Box>
  );
}

export default App;