import ControlPanel from '../panels/ControlPanel/ControlPanel.js';
import ControlSliderPanel from "../panels/ControlPanel/ControlSliderPanel";
import DoePanel from "../panels/DoePanel/DoePanel";
import ControlImagePanel from "../panels/ControlPanel/ControlImagePanel";
//import MqttPanel from "../panels/MqttPanel/MqttPanel";

function PlayPage() {
  return (
    <div className="mqtt-page">
      <ControlImagePanel title='Experiment Panel'/>
      <ControlPanel title='Control Panel'/>
      <ControlSliderPanel title='Control Slider Panel'/>
      <DoePanel title='DOE Panel' />
    </div>
  )
}

export default PlayPage;