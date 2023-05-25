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

const msg = (level, func, _funcType, ...snippets) => {
  if (level > global.debugLevel) return;

//let payload = {
//  function: func,
//  program: global.aaa.program,
//  funcType: msgE[_funcType],
//  content: snippets.join(' '),
//}

//const topic = mqttNode.makeTopic(_funcType,"post")
//const jpayload = JSON.stringify(payload);
//if (mqttNode.connected()) {
//  mqttNode.publish(topic, jpayload);
//

  let funcType = msgE[_funcType]
  if (_funcType == ERROR) {
    funcType = '********** ERROR'
  } else if (_funcType == ALARM) {
    funcType = '---------- ALARM'
  } else if (_funcType == WARNING) {
    funcType = '!!!!!!!!!! WARNING'
  }
  if (snippets.length > 0) {
    console.log(funcType, func, ...snippets)
  } else {
    console.log(funcType, func);
  }
}

module.exports = {
  msg: msg,
//msgn: msg,
  setDebugLevel: setDebugLevel,
}
