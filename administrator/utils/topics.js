// topics.js
//   functions to build, complete, and modify topics

const completeTopic = (topic) => {
  // Parse into fields
  var fields = topic.split('/');
  console.log('topic ' + topic);
  console.log('fields ' + fields);
  for (let f in fields) {
    var field = fields[f];
    // if first letter is a cap that it may require substitution
    console.log('field ' + field);
    if (field[0] <= 'Z') {
      console.log('found one ' + field)
      if (field == 'PROJECT') {
        if (global.aaa.project) {
          fields[f] = global.aaa.project;
        } else {
          fields[f] = 'not found';
        }
      } else if (field == 'CLIENTID') {
        if (global.aaa.clientid) {
          fields[f] = global.aaa.clientid;
        } else {
          fields[f] = 'not found';
        }
      } else if (field == 'CLIENT') {
        if (global.aaa.client) {
          fields[f] = global.aaa.client;
        } else {
          fields[f] = 'not found';
        }
      } else if (field == 'NAME') {
        if (global.aaa.name) {
          console.log('sub one ' + global.aaa.name)
          fields[f] = global.aaa.name;
        } else {
          fields[f] = 'not found';
        }
      } else if (field == 'USERID') {
        if (global.aaa.userid) {
          fields[f] = global.aaa.userid;
        } else {
          fields[f] = 'not found';
        }
      } else if (field == 'TELEGRAPHID') {
        if (global.aaa.name) {
          fields[f] = global.aaa.name;
        } else {
          fields[f] = 'not found';
        }
      }
    }
  }
  var ntopic = fields.join('/');
  console.log ('topic ' + topic)
  console.log ('ntopic ' + ntopic)
  return ntopic;
}


const completeTopics = (_topics) => {
  var topics = [];
  for (let name in _topics) {
    var ntopic = completeTopic(_topics[name]);
    topics[name] = ntopic
  }
  return topics;
}

module.exports = {
  completeTopic: completeTopic,
  completeTopics: completeTopics,
};
module.exports.completeTopics = completeTopics;
