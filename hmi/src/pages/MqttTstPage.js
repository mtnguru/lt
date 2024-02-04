import MqttManager from '../MqttManager.js'
import MqttPanel from '../panels/MqttPanel/MqttPanel.js'

//import "./MqttPage.scss"

function MqttPage() {
  return (
    <MqttManager
      url="labtime.org"
      username="data"
      password="datawp"
      port="8084"
      clientId="hmi-mqtt-tst"
      type="mqtt"
      pageId="hmi">


      <div className="mqtt-page">
        <MqttPanel title='MQTT Activity Panel'/>
      </div>
    </MqttManager>
  )
}

export default MqttPage;