// import React, {useState} from 'react';
import { Container,
         Heading} from '@chakra-ui/react'

function MsgHeader(props) {
  return (
    <Container className="msg-header-container">
      <Heading as="h3" className="msg-header-name">{props.name}</Heading>
    </Container>
  );
}


export default MsgHeader