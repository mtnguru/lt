import MqttManager from '../MqttManager.js'
import MqttPanel from '../panels/MqttPanel/MqttPanel.js'

//import "./MqttPage.scss"

function MqttPage() {
  return (
    <MqttManager
      url="labtime.org:8081"
      username="data"
      password="datawp"
      projectId="all"
      clientId="hmi-mqtt"
      type="mqtt"
      pageId="hmi">

      <div className="mqtt-page">
        <MqttPanel title='MQTT Activity Panel'/>
      </div>
    </MqttManager>
  )
}

export default MqttPage;
