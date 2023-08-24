// import './MqttClientList.scss'
import MqttClient from './MqttClient.js'

function MqttClientList (props) {
//for (let item in props.list) {
//  console.log(props.list[item]);
//}
  const onChangeH = (event) => {
    console.log('MqttClientList::onChangeH - ',event.target.id, event.target.checked)
    props.onChangeH(event)
  }
  return (
    <div className='client-list'>
      {Object.keys(props.list).map(key => {
        return <MqttClient onChangeH={onChangeH} className={key} key={key} id={key} client={props.list[key]} />
      })}
    </div>
  );
}

export default MqttClientList;
/*
return <Checkbox onChangeH={onChangeH} className={key} key={key} name={props.list[key]} />
*/