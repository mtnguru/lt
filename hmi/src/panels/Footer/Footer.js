// Footer.js

import React, {useState, useEffect} from 'react';
import { Button } from '@chakra-ui/react'
import {useDisclosure} from "@chakra-ui/react";
import UserNamePopup from './UserNamePopup';

import './Footer.scss';

function Footer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const key = "ltUser";
  const [username, setUsername] = useState("")

  const handleUsernameSubmit = (value) => {
    localStorage.setItem(key,value)
    setUsername(value)
    global.aaa.username = value
  };

  // Open the popup on startup
  useEffect(() => {
    let username = localStorage.getItem(key);
    if (!username || username === "") {
      onOpen();
    } else {
      setUsername(username)
      global.aaa.username = username
    }
  }, [onOpen]);

  return (
    <footer className="footer">
      <UserNamePopup
        isOpen={isOpen}
        onClose={onClose}
        onUsernameSubmit={handleUsernameSubmit}
      />
      <Button onClick={onOpen} fontWeight="300">Username: {username}</Button>
    </footer>
  )
}

export default Footer;