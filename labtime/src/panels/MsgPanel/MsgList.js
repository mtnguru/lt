// import React, {useState} from 'react';

import { Container } from '@chakra-ui/react'
import MsgItem from './MsgItem'

function MsgList(props) {
  let list = (props.list) ? props.list : []

  return (
    <Container className="msg-list-container">
      <div className="msg-list">
        {list.map(item => <MsgItem key={item.key} item={item} pretty={props.pretty}/>) }
      </div>
    </Container>
  );
}


export default MsgList