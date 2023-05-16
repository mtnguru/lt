
//import {mqttPublish, mqttConnected} from "./mqttReact"
//import Topics from "./topics"

const mg = (func, _funcType, ...snippets) => {
  /*
  let payload = {
    function: func,
//  program: global.aaa.program,
    funcType: funcType,
    content: snippets.join(' '),
  }

  const topic = global.aaa.topics.publish.msg
  const jpayload = JSON.stringify(payload);
  if (mqttConnected()) {
    mqttPublish(topic, jpayload);
  }
  */

  let funcType = _funcType
  if (funcType === 'error') {
    funcType = '********** ERROR'
  } else if (funcType === 'alarm') {
    funcType = '---------- ALARM'
  } else if (funcType === 'warning') {
    funcType = '!!!!!!!!!! WARNING'
  }
  console.log(funcType, func, ...snippets);
}

const mgError   = (f, ...snippets) => { mg(f,'error',snippets) }
const mgWarning = (f, ...snippets) => { mg(f,'warning',snippets) }
const mgDebug   = (f, ...snippets) => { mg(f,'debug',snippets) }
const mgNotify  = (f, ...snippets) => { mg(f,'notify',snippets) }
const mgAdmin   = (f, ...snippets) => { mg(f,'admin',snippets) }
const mgAlarm   = (f, ...snippets) => { mg(f,'alarm',snippets) }
const mgChat    = (f, ...snippets) => { mg(f,'chat',snippets) }
const mgNotes   = (f, ...snippets) => { mg(f,'notes',snippets) }
const mgUser    = (f, ...snippets) => { mg(f,'user',snippets) }
const mgInput   = (f, ...snippets) => { mg(f,'input',snippets) }
const mgOutput  = (f, ...snippets) => { mg(f,'output',snippets) }
const mgDoe     = (f, ...snippets) => { mg(f,'doe',snippets) }

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
  mgDoe
}
