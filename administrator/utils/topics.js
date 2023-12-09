// topics.js
//   functions to build, complete, and modify topics

const completeTopic = (_topic,_args) => {
  // Parse into fields
  var fields = _topic.split('/');
  // console.log('topic ' + _topic);
  // console.log('fields ' + fields);
  for (let f in fields) {
    var field = fields[f];
    if (field[0] <= 'Z') {  // if name is ALL CAPS
      if (f === "0" && field === "PROJECTID") {
        if (_args && _args["projectId"]) {
          fields[0] = _args["projectId"];
        }
      }
      if (f === "2" && field === "CLIENTID") {
        if (_args && _args["clientId"]) {
          fields[2] = _args["clientId"];
        }
      }
      if (f === "3" && field === "USERID") {
        if (_args && _args["userId"]) {
          fields[3] = _args["userId"];
        }
      }
      if (f === "4") {
        if (field === "EDGEID") {
          if (_args && _args["edgeId"]) {
            fields[4] = _args["edgeId"];
          }
        }
        if (field === "MESSAGEID") {
          if (_args && _args["msgId"]) {
            fields[4] = _args["msgId"];
          }
        }
      }
    }
  }
  var ntopic = fields.join('/');
  // console.log ('topic ' + _topic)
  // console.log ('ntopic ' + ntopic)
  return ntopic;
}

const completeTopics = (_topics, args) => {
  var topics = {}
  for (let name in _topics) {
    var ntopic = completeTopic(_topics[name], args);
    topics[name] = ntopic
  }
  return topics;
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
  ckTopic: ckTopic,
  makeTopic: makeTopic,
};