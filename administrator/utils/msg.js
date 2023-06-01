//require('dotenv').config();
require('./msgE');
// const mqttNode = require('./mqttNode');

//global.debugLevel = 0;

let msgFlagsA = {
  ERROR: true,
  WARNING: true,
  DEBUG: true,
  NOTIFY: true,
  ADMIN: true,
  CONFIG: true,
  ALARM: true,
  CHAT: true,
  NOTES: true,
  USER: true,
  INPUT: true,
  OUTPUT: true,
  DOE: true
}

const setDebugLevel = (level) => {
  global.debugLevel = level;
}

const msg = (level, func, _funcId, ...snippets) => {
  if (level > global.debugLevel) return;

//let payload = {
//  function: func,
//  program: global.aaa.program,
//  funcId: msgE[_funcId],
//  content: snippets.join(' '),
//}

//const topic = mqttNode.makeTopic(_funcId,"post")
//const jpayload = JSON.stringify(payload);
//if (mqttNode.connected()) {
//  mqttNode.publish(topic, jpayload);
//

  let funcId = msgE[_funcId]
  if (_funcId == ERROR) {
    funcId = '********** ERROR'
  } else if (_funcId == ALARM) {
    funcId = '---------- ALARM'
  } else if (_funcId == WARNING) {
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
