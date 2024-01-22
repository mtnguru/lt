// topics.js
//   functions to build, complete, and modify topics

const completeTopic = (_topic,_args) => {
  if (_topic === undefined) {
    console.log('completeTopic ' + _topic)
    return;
  }
  if (_topic === undefined) {
    return;
  }
  var fields = _topic.split('/');
  // console.log('topic ' + _topic);
  // console.log('fields ' + fields);
  for (let f in fields) {
    var field = fields[f];
    if (field[0] <= 'Z') {  // if name is ALL CAPS
      switch (f) {
        case "0":
          if (field === "PROJECTID") {
            if (_args && _args["projectId"]) {
              fields[0] = _args["projectId"];
            }
          }
          break;
      //case "1" // do nothing
        case "2":
          if (field === "CLIENTID") {
            if (_args && _args["clientId"]) {
              fields[2] = _args["clientId"];
            }
          }
          break;
        case "3":
          if (field === "USERID") {
            if (_args && _args["userId"]) {
              fields[3] = _args["userId"];
            }
          }
          break;
        case "4":
          if (field === "EDGEID") {
            if (_args && _args["edgeId"]) {
              fields[4] = _args["edgeId"];
            }
          }
          if (field === "MSGID") {
            if (_args && _args["msgId"]) {
              fields[4] = _args["msgId"];
            }
          }
          break;
        default:
          break;
      }
    }
  }
  // console.log ('topic before ' + _topic)
  _topic = fields.join('/');
  // console.log ('topic after  ' + _topic)
  return _topic;
}

const completeAllTopics = (_topics, args) => {
  var topics = JSON.parse(JSON.stringify(_topics))
  if (topics.subscribe) {
    topics.subscribe = completeTopics(topics.subscribe, args)
  }
  if (topics.register) {
    topics.register = completeTopics(topics.register, args)
  }
  if (topics.publish) {
    topics.publish = completeTopics(topics.publish, args)
  }
  return topics;
}

const completeTopics = (_topics, args) => {
  for (let name in _topics) {
    _topics[name] = completeTopic(_topics[name], args);
  }
  return _topics;
}

const makeTopic = (projectId, func, clientId, userId, telegrafId) => {
  var topic;
  if (telegrafId) {
    topic = `${projectId}/${func}/${clientId}/${userId}/${telegrafId}`
  } else if (userId) {
    topic = `${projectId}/${func}/${clientId}/${userId}`
  } else if (clientId) {
    topic = `${projectId}/${func}/${clientId}`
  } else {
    topic = `${projectId}/${func}`
  }
  return topic
}

const ckTopic = (_type, _key) => {
  if (global.aaa.topics[_type]) {
    var topic = global.aaa.topics[_type][_key]
    if (topic) {
      return topic
    }
  }
  console.log("ckTopic - topic not found in: global.aaa.topics." + _type + "." + _key)
}

module.exports = {
  completeTopic: completeTopic,
  completeTopics: completeTopics,
  completeAllTopics: completeAllTopics,
  ckTopic: ckTopic,
  makeTopic: makeTopic,
};