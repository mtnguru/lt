import React, {useEffect} from 'react';
import {
  Container,
  } from '@chakra-ui/react'

import { mqttRegisterTopicCB } from '../../utils/mqttReact'
import MqttItem from './MqttItem'
import {ckTopic} from '../../utils/topics'
import './MqttList.scss';

function MqttList(props) {
  // if list does not exist - set list to an empty array
  let list = (props.list) ? props.list : []

  const topicCB = (_topic, _payload) => {
    return _payload
  }

  useEffect(() => {
    mqttRegisterTopicCB(ckTopic("register","msg"), topicCB, {})
    //Runs only on the first render
  }, []);

  return (
    <Container w="100%" maxW="1200px" className="mqtt-display">
      <div className="nitems">{list.length}</div>
       <div className="mqtt-list mqtt-source-bg mqtt-clientId-bg">
          {list.map(item => <MqttItem key={item.key} item={item} pretty={props.pretty}/>) }
       </div>
    </Container>
  );
}


export default MqttList
