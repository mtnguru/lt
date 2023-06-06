// import React, {useState} from 'react';

import { Container } from '@chakra-ui/react'
import MsgItem from './MsgItem'

function MsgList(props) {
  let list = (props.list) ? props.list : []

  return (
    <Container className="msg-list-container">
      <div className="msg-list">
        {list.map(item =>
          <div className="msg-item">
            <div key={item.key} className="header" item={item} pretty={props.pretty}>
              {`${item.date} - ${item.author}`}
            </div>
            <div className="msg-text">
              {item.msg.map(line => <div>{line}</div>)}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}


export default MsgList