// import React, {useState} from 'react';

import { Box } from '@chakra-ui/react'
//import MsgItem from './MsgItem'

function MsgList(props) {
  let list = (props.list) ? props.list : []

  return (
    <Box className="msg-list-container" minH="30vh" maxH="55vh" bg="bg3">
      <div className="msg-list">
        {list.map(item =>
          <div className="msg-item">
            <span key={item.key} className="header" item={item} pretty={props.pretty}>
              {`${item.date} - ${item.author}`}
            </span>
            <span className="msg-text">
              {item.msg.map(line => <div>{line}</div>)}
            </span>
          </div>
        )}
      </div>
    </Box>
  );
}


export default MsgList