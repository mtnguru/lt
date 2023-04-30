// import React, {useState} from 'react';
import { Button } from '@chakra-ui/react'

function MsgHeader(props) {
  // if list does not exist - set list to an empty array
  let list = (props.list) ? props.list : []

  return (
    <div className="msg-header-container">
      <h3 className="msg-header-name">{props.name}</h3>
      <Button>add</Button>
    </div>
  );
}


export default MsgHeader
