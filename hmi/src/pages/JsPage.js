
import JsContent from './JsContent'
import MqttManager from '../MqttManager'

import './JsPage.scss'

function JsPage() {

  return (
    <MqttManager
      url="labtime.org:8084"
      username="data"
      password="datawp"
      projectId="js"
      clientId="hmi-js"
      type="hmi"
      pageId="js">
      <JsContent />
    </MqttManager>
  )
}
export default JsPage;
