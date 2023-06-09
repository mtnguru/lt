//require('dotenv').config();
require('./msgE');
// const mqttNode = require('./mqttNode');

const setDebugLevel = (level) => {
  global.aas.debugLevel = level;
}

const msg = (level, func, _funcId, ...snippets) => {
  if (level > global.aas.debugLevel) return;

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