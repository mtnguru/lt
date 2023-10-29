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

const UserIdPopup = ({ isOpen, onClose, onUserIdSubmit }) => {
  const [userId, setUserId] = useState('');

  const handleSubmit = () => {
    onUserIdSubmit(userId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter a UserId</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="UserId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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

export default UserIdPopup;
