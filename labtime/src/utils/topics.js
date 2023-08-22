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
      if (f === "1" && field === "INSTANCE") {
        if (args && args["instance"]) {
          fields[1] = args["instance"];
        } else {
          fields[1] = (global.aaa.instance) ? global.aaa.instance : "+"
        }
      }
      if (f === "3" && field === "CLIENTID") {
        if (args && args["clientId"]) {
          fields[3] = args["clientId"];
        } else {
          fields[3] = (global.aaa.clientId) ? global.aaa.clientId : "CLIENTID"
        }
      }
      if (f === "4" && field === "USERID") {
        if (args && args["userId"]) {
          fields[4] = args["userId"];
        } else {
          fields[4] = (global.aaa.userId) ? global.aaa.userId : "USERID"
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

const makeTopic = (projectId, instance, func, clientId, userId, telegrafId) => {
  var topic;
  if (telegrafId) {
    topic = `${projectId}/${instance}/${func}/${clientId}/${userId}/${telegrafId}`
  } else if (userId) {
    topic = `${projectId}/${instance}/${func}/${clientId}/${userId}`
  } else if (clientId) {
    topic = `${projectId}/${instance}/${func}/${clientId}`
  } else {
    topic = `${projectId}/${instance}/${func}`
  }
  return topic
}

module.exports = {
  completeTopic: completeTopic,
  completeTopics: completeTopics,
  makeTopic: makeTopic,
};
