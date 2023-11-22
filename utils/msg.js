//require('dotenv').config();
require("./msgE");
const mqttNode = require('./mqttNode');

const setDebugLevel = (level) => {
  global.aaa.status.debugLevel = level;
}

const msg = (level, func, _sourceId, ...snippets) => {
  const f = "utils/msg.js"
  if ("status" in global.aaa && "debugLevel" in global.aaa.status) {
    if (level > global.aaa.status.debugLevel)
      return;
  } else {
    console.log(f, "ERROR: debugLevel not set");
    return;
  }

  var sourceId = msgE[_sourceId]
  if (_sourceId === ERROR) {
    sourceId = '********** ERROR'
  } else if (_sourceId === ALARM) {
    sourceId = '---------- ALARM'
  } else if (_sourceId === WARNING) {
    sourceId = '!!!!!!!!!! WARNING'
  }

  if (mqttNode.connected()) {
    let payload = {
      function: func,
      name: global.aaa.name,
      sourceId: msgE[_sourceId],
      content: snippets.join(' '),
    }

    const topic = global.aaa.topics.publish.msg
    const jpayload = JSON.stringify(payload);
    mqttNode.publish(topic, jpayload);
  }

  if (snippets.length > 0) {
    console.log(sourceId, func, ...snippets)
  } else {
    console.log(sourceId, func);
  }
}

module.exports = {
  msg: msg,
//msgn: msg,
  setDebugLevel: setDebugLevel,
}