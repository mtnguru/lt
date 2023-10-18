import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from '@chakra-ui/react';

const UserNamePopup = ({ isOpen, onClose, onUsernameSubmit }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    onUsernameSubmit(username);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter a Username</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="purple" mr={3} onClick={handleSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserNamePopup;