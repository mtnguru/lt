//require('dotenv').config();
const mqttNode = require('./mqttNode');

const setDebugLevel = (level) => {
  global.aaa.status.debugLevel = level;
}

msgE = {
  error: 0,
  warning: 1,
  debug: 2,
  notify: 3,
  admin: 4,
  alarm: 5,
  chat: 6,
  notes: 7,
  user: 8,
  input: 9,
  output: 10,
  doe: 11,
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

  const cdate = new Date();
  const fdate = `${cdate.getDate()} ${cdate.getHours()}:${cdate.getMinutes()}:${cdate.getSeconds()}`;

  var topic = global.aaa.topics.publish.cod
  var actionId = msgE[_actionId]
  if (_actionId === msgE.error) {
    topic = global.aaa.topics.publish.cod
    actionId = '********** ERROR'
  } else if (_actionId === msgE.alarm) {
    topic = global.aaa.topics.publish.cod
    actionId = '---------- ALARM'
  } else if (_actionId === msgE.warning) {
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
    console.log(fdate, actionId, func, ...snippets)
  } else {
    console.log(fdate, actionId, func);
  }
}

module.exports = {
  msg: msg,
  msgE: msgE,
  setDebugLevel: setDebugLevel,
}