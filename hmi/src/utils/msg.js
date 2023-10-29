//require('dotenv').config();
require("./msgE");
// const mqttNode = require('./mqttNode');

const setDebugLevel = (level) => {
  global.aaa.status.debugLevel = level;
}

const msg = (level, func, _funcId, ...snippets) => {
  const f = "utils/msg.js"
  if ("status" in global.aaa && "debugLevel" in global.aaa.status) {
    if (level > global.aaa.status.debugLevel)
      return;
  } else {
    console.log (f, "ERROR: debugLevel not set");
    return;
  }

  if (mqttNode.connected()) {
    let payload = {
      function: func,
      program: global.aaa.program,
      funcId: msgE[_funcId],
      content: snippets.join(' '),
    }

    const topic = mqttNode.makeTopic(_funcId,"post")
    const jpayload = JSON.stringify(payload);
    mqttNode.publish(topic, jpayload);
  }


  var funcId = msgE[_funcId]
  if (_funcId === ERROR) {
    funcId = '********** ERROR'
  } else if (_funcId === ALARM) {
    funcId = '---------- ALARM'
  } else if (_funcId === WARNING) {
    funcId = '!!!!!!!!!! WARNING'
  }
  if (snippets.length > 0) {
    console.log(funcId, func, ...snippets)
  } else {
    console.log(funcId, func);
  }
}

module.exports = {
  msg: msg,
//msgn: msg,
  setDebugLevel: setDebugLevel,
}