//require('dotenv').config();
require("./msgE");
const mqttNode = require('./mqttNode');

const setDebugLevel = (level) => {
  global.aaa.status.debugLevel = level;
}

const msg = (level, func, _actionId, ...snippets) => {
  const f = "utils/msg.js"
  if ("status" in global.aaa && "debugLevel" in global.aaa.status) {
    if (level > global.aaa.status.debugLevel)
      return;
  } else {
    console.log(f, "ERROR: debugLevel not set");
    return;
  }

  var topic = global.aaa.topics.publish.cod
  var actionId = msgE[_actionId]
  if (_actionId === ERROR) {
    topic = global.aaa.topics.publish.cod
    actionId = '********** ERROR'
  } else if (_actionId === ALARM) {
    topic = global.aaa.topics.publish.cod
    actionId = '---------- ALARM'
  } else if (_actionId === WARNING) {
    topic = global.aaa.topics.publish.cod
    actionId = '!!!!!!!!!! WARNING'
  }

  if (mqttNode.connected()) {
    let payload = {
      function: func,
      name: global.aaa.name,
      type: msgE[_actionId],
      content: snippets.join(' '),
    }

    const jpayload = JSON.stringify(payload);
    mqttNode.publish(topic, jpayload);
  }

  if (snippets.length > 0) {
    console.log(actionId, func, ...snippets)
  } else {
    console.log(actionId, func);
  }
}

module.exports = {
  msg: msg,
//msgn: msg,
  setDebugLevel: setDebugLevel,
}
