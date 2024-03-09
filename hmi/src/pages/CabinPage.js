
import CabinContent from './CabinContent'
import MqttManager from '../MqttManager'

import './CabinPage.scss'

function CabinPage() {

  return (
    <MqttManager
      url="labtime.org:8084"
      username="data"
      password="datawp"
      projectId="cb"
      clientId="hmi-cb"
      type="hmi"
      pageId="cb">
      <CabinContent />
    </MqttManager>
  )
}
export default CabinPage;
