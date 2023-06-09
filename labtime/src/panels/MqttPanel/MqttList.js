import React, {useEffect} from 'react';

import { mqttRegisterTopicCB } from '../../utils/mqttReact'
import MqttItem from './MqttItem'
import './MqttList.scss';

function MqttList(props) {
  // if list does not exist - set list to an empty array
  let list = (props.list) ? props.list : []

  const topicCB = (_topic, _payload) => {
    return _payload
  }

  useEffect(() => {
    mqttRegisterTopicCB(global.aaa.topics.register.msg, topicCB, {})
    //Runs only on the first render
  }, []);

  return (
    <div className="mqtt-display">
      <div className="nitems">{list.length}</div>
       <div className="mqtt-list mqtt-func-bg mqtt-clientId-bg">
          {list.map(item => <MqttItem key={item.key} item={item} pretty={props.pretty}/>) }
       </div>
    </div>
  );
}


export default MqttList