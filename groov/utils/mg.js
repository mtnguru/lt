
import {mqttPublish, mqttConnected} from "./mqttReact"
//import Topics from "./topics"

const mg = (level, f, _actionId, _type, ...snippets) => {
  var actionId = _actionId
  var type = _type.toLowerCase()

  if (level > global.aaa.status.debugLevel) return;

  var payload = {
    "function": f,
    actionId: actionId,
    type: type,
    program: global.aaa.program,
    msg: snippets.join(' '),
  }

  if (mqttConnected()) {
    const topic = global.aaa.topics.publish[_actionId]
    if (topic) {
      const jpayload = JSON.stringify(payload);
      mqttPublish(topic, jpayload);
    }
  }

  if (type === 'error') {
    type = '********** ERROR'
  } else if (type === 'alarm') {
    type = '---------- ALARM'
  } else if (type === 'warning') {
    type = '!!!!!!!!!! WARNING'
  }
  console.log(actionId, type, ...snippets)
}

const mgError   = (level, f, ...snippets) => { mg(level, f,'cod','error',snippets) }
const mgWarning = (level, f, ...snippets) => { mg(level, f,'cod','warning',snippets) }
const mgDebug   = (level, f, ...snippets) => { mg(level, f,'cod','debug',snippets) }
const mgNotify  = (level, f, ...snippets) => { mg(level, f,'msg','notify',snippets) }
const mgAdmin   = (level, f, ...snippets) => { mg(level, f,'adn','admin',snippets) }
const mgAlarm   = (level, f, ...snippets) => { mg(level, f,'alm','alarm',snippets) }
const mgChat    = (level, f, ...snippets) => { mg(level, f,'msg','chat',snippets) }
const mgNotes   = (level, f, ...snippets) => { mg(level, f,'msg','notes',snippets) }
const mgUser    = (level, f, ...snippets) => { mg(level, f,'hum','human',snippets) }
const mgInput   = (level, f, ...snippets) => { mg(level, f,'inp','input',snippets) }
const mgOutput  = (level, f, ...snippets) => { mg(level, f,'out','output',snippets) }

export {
  mgError,
  mgWarning,
  mgDebug,
  mgNotify,
  mgAdmin,
  mgAlarm,
  mgChat,
  mgNotes,
  mgUser,
  mgInput,
  mgOutput,
}
