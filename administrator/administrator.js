// File: administrator.js

const fs = require('fs')
const mqttNode  = require('./utils/mqttNode');
const Topics  = require('./utils/topics');
require('dotenv').config();

const f = "administrator:main - "
// require cn modules
const configurator = require('./configurator');
global.startTime = Date.now()

let jsonStr = fs.readFileSync(`${process.env.ROOT_PATH}/config/clients/administrator.json`)
global.aaa = JSON.parse(jsonStr)
global.aaa.userid = 'administrator';
global.aaa.clientid = 'administrator';
global.aaa.projectid = 'P1';
global.aaa.mqtt.clientId = `administrator${Math.random().toString(16).slice(3)}`
global.aaa.ips = {};
console.log('Read in client configurations')

// Read in ips of all clients
for (let clientName in global.aaa.clients) {
  let path = `${process.env.ROOT_PATH}/config/clients/${clientName}.json`
  console.log('Load client ', clientName)
  if (fs.existsSync(path)) {
    let json = fs.readFileSync(path)
    let data = JSON.parse(json)
    var client = {
      clientName: clientName,
      ip: data.ip
    }
    global.aaa.clients[clientName] = client;
    global.aaa.ips[data.ip] = client;

  } else {
    console.log('File does not exist - (okay if "all") ',path)
  }
}

console.log ('subscribe ' + global.aaa.subscribeTopics)
global.aaa.subscribeTopics = Topics.completeTopics(global.aaa.subscribeTopics);

console.log(f, 'connect to mqtt server and submit start main thread')
mqttNode.connect(configurator.processCB,'-');
console.log(f, 'exit main thread')
