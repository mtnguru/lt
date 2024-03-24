import OxyContent from './OxyContent'
import MqttManager from '../MqttManager'

import './OxyPage.scss'
import './Page.scss'

function OxyPage() {

  return (
    <MqttManager
      url="labtime.org:8081"
      username="data"
      password="datawp"
      projectId="oxy"
      type="hmi"
      clientId="hmi-oxy"
      pageId="oxy">
      <OxyContent />
    </MqttManager>
  )
}
export default OxyPage;
