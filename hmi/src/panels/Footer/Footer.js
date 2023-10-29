// Footer.js

import React, {useState, useEffect} from 'react';
import { Button } from '@chakra-ui/react'
import {useDisclosure} from "@chakra-ui/react";
import UserIdPopup from './UserIdPopup';

import './Footer.scss';

function Footer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const key = "ltUser";
  const [userId, setUserId] = useState("")

  const handleUserIdSubmit = (value) => {
    localStorage.setItem(key,value)
    setUserId(value)
    global.aaa.userId = value
  };

  // Open the popup on startup
  useEffect(() => {
    let userId = localStorage.getItem(key);
    if (!userId || userId === "") {
      onOpen();
    } else {
      setUserId(userId)
      global.aaa.userId = userId
    }
  }, [onOpen]);

  return (
    <footer className="footer">
      <UserIdPopup
        isOpen={isOpen}
        onClose={onClose}
        onUserIdSubmit={handleUserIdSubmit}
      />
      <Button onClick={onOpen} fontWeight="300">UserId: {userId}</Button>
    </footer>
  )
}

export default Footer;
