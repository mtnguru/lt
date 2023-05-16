// topics.js
//   functions to build, complete, and modify topics

const completeTopic = (topic,args) => {
  // Parse into fields
  var fields = topic.split('/');
  // console.log('topic ' + topic);
  // console.log('fields ' + fields);
  for (let f in fields) {
    var field = fields[f];
    if (field[0] <= 'Z') {  // if name is ALL CAPS
      if (f === "0" && field === "PROJECTID") {
        if (args && args["projectId"]) {
          fields[0] = args["projectId"];
        } else {
          fields[0] = (global.aaa.projectId) ? global.aaa.projectId : "PROJECTID"
        }
      }
      if (f === "2" && field === "CLIENTID") {
        if (args && args["clientId"]) {
          fields[2] = args["clientId"];
        } else {
          fields[2] = (global.aaa.clientId) ? global.aaa.clientId : "CLIENTID"
        }
      }
      if (f === "3" && field === "USERID") {
        if (args && args["userId"]) {
          fields[3] = args["userId"];
        } else {
          fields[3] = (global.aaa.userId) ? global.aaa.userId : "USERID"
        }
      }
    }
  }
  var ntopic = fields.join('/');
  // console.log ('topic ' + topic)
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

module.exports = {
  completeTopic: completeTopic,
  completeTopics: completeTopics,
  makeTopic: makeTopic,
};
