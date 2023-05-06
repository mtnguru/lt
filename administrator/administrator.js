// File: administrator.js
const fs = require('fs')
const YAML = require('yaml-parser')
require('dotenv').config();

const mqttNode  = require('./utils/mqttNode');
const Topics  = require('./utils/topics');
const {msg} = require("./utils/msg");
const influx = require("./utils/influx");

const f = "administrator:main - "
const stageId = 'dev'

global.startTime = Date.now()

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getHmiConfig = (ip) => {
  const f = 'administrator::getHmiConfig'
  msg(2,f,DEBUG, 'enter ',ip);
  return global.config.hmi;
}

const getJsonFile = (filepath) => {

}

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const findClient = (id) => {
  const f = 'administrator:findClient'
  msg(2,f,DEBUG,'enter',id);

  // Find the client first by clientId, then by searching the IP's of all devices.
  var client;
  if (global.aaa.clients[id]) {
    client = global.aaa.clients[id]
  }
  if (global.aaa.ips[id]) {
    client = global.aaa.ips[id]
  }
  if (!client) {
    msg(0, f, ERROR, 'Cannot find client', id)
    return null;
  }
  msg(2,f,DEBUG, 'exit');
  return client;
}

const publishStatus = () => {
  let outTopic = global.aaa.topics.publish.adm;
  let elapsedSeconds = parseInt((Date.now() - global.startTime) / 1000)
  let elapsedHours = elapsedSeconds / (60 * 60)
  let out = {
    status: 'nominal',
    uptimeHours: elapsedHours,
    uptimeSeconds: elapsedSeconds,
    debugLevel: global.aaa.debugLevel
  }

  let outStr = JSON.stringify(out);
  mqttNode.publish(outTopic, outStr);
}

const resetServer = () => {
}

/**
 * processCB
 */
const processCB = (topic, payloadRaw) => {
  const f = 'administrator::processCB'
  msg(1,f,DEBUG, 'enter');
  readConfig();
  let out;
  let outTopic;
  try {
    const [projectId, func, clientId, userId, telegrafId] = topic.split('/')

    const inputStr = payloadRaw.toString();
    let input = {}

    // If the payload is JSON, parse it
    if (inputStr && inputStr !== '{}') {
      msg(3,f, DEBUG,"Parse inputStr:", inputStr.toString)
      input = JSON.parse(inputStr)
    }
    msg(3,f,DEBUG, 'func', func, ' clientId', clientId);

    // If this is an admin message
    if (global.aaa.topics.subscribe['cmd'] === topic) {
      if (input.cmd) {
        if (clientId === global.aaa.clientId || clientId === 'all') {  // commands specifically for the server
          if (input.cmd === 'setDebugLevel') {
            global.aaa.debugLevel = input.debugLevel;
          }
          // Request to reset server client
          if (input.cmd === 'reset') {
            resetServer();
          }
          // Request for status
          if (input.cmd === 'requestStatus') {
            publishStatus();
          }
          var dclientId = (input.ip) ? input.ip : input.clientId
          if (input.cmd === 'requestConfig') {
            var dclientId = (input.ip) ? input.ip : input.clientId
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, dclientId)
            out = findClient(dclientId)
          }
          if (input.cmd === 'requestFile') {
//          outTopic = mqttNode.makeTopic(ADMIN, 'file', clientId)
            path = `${process.env.ROOT_PATH}/config/${input.path}`
            msg(2, f, DEBUG, "Read json file: ", path)
            json = fs.readFileSync(path)
            out = JSON.parse(json)
          }
        }
      }
    }

    var d = new Date(Date.now())
    out.date = d.getFullYear() + "-" +
               d.getMonth() + "-" +
               d.getDate() + " " +
               d.getHours() + ":" +
               d.getMinutes() + ":" +
               d.getSeconds()
    out.cmd = input.cmd
    var outStr = JSON.stringify(out)
    msg(1,f, DEBUG,"call mqttNode.publish ",outTopic, out)
    mqttNode.publish(outTopic, outStr);
  } catch (err) {
    msg(0,f, ERROR, err)
  }
  msg(2,f,DEBUG, 'exit');
  return null;
}

const findProject = (projectId) => {
  for (var id in global.aaa.projects) {
    if (id === projectId) {
      return global.aaa.projects[id]
    }
  }
}

const initMetrics = (projectId, project) => {
  // Read in the metrics for this project
  var path = `${process.env.ROOT_PATH}/${stageId}/${projectId}/metrics.yml`
  project.metrics = YAML.safeLoad(fs.readFileSync(path));
  // for each metric in project
  for (var oMetricId in project.metrics) {
    var metric = project.metrics[oMetricId]
    var metricId = oMetricId.toLowerCase();
    metric.name = oMetricId
    metric.metricId = metricId
    metric.projectId = projectId
    var flds = metric.name.split('_')
    metric.units = flds[flds.length - 1]
    if (metricId != oMetricId) {
      delete project.metrics[oMetricId]
      project.metrics[metricId] = metric
    }

    // assign inputs, outputs and human to correct clients
    var client
    if (metric.input) {
      if (client = project.clients[metric.input.clientId]) {
        if (!client.inputs) client.inputs = {}
        client.inputs[metricId] = metric
        metric.input.tags = influx.makeTagsFromMetricId(metric.name, "I", projectId)
      }
    }
    if (metric.output) {
      if (client = project.clients[metric.output.clientId]) {
        if (!client.outputs) client.outputs = {}
        client.outputs[metricId] = metric
        metric.output.tags = influx.makeTagsFromMetricId(metric.name, "O", projectId)
      }
    }
    if (metric.human) {
      if (client = project.clients[metric.human.clientId]) {
        if (!client.humans) client.humans = {}
        client.humans[metricId] = metric
        metric.human.tags = influx.makeTagsFromMetricId(metric.name, "H", projectId)
      }
    }
  } // for each metric in project
}

const initClients = (projectId, project, msgTypes) => {
  // For each client create lookup lists by clientId and IP
  for (var clientId in project.clients) {
    var client = project.clients[clientId]
    if (client) {
//    var flds = metric.name.split('_')
      client.clientId = clientId
      client.projectId = projectId

      global.aaa.clients[clientId] = client;
      if (client.ip) {
        global.aaa.ips[client.ip] = client;
      }

      if (client.metrics && client.metrics === 'project') {
        client.metrics = project.metrics
      }

      if (client.topics) {
        var project = findProject(client.projectId)
        if (project.topics && project.topics[client.topics]) {
          var topics = project.topics[client.topics]
          client.topics = {}
          client.topics.subscribe = Topics.completeTopics(JSON.parse(JSON.stringify(topics.subscribe)), client);
          client.topics.publish = Topics.completeTopics(JSON.parse(JSON.stringify(topics.publish)), client);
        } else {
          client.topics.subscribe = Topics.completeTopics(JSON.parse(JSON.stringify(client.topics.subscribe)), client);
          client.topics.publish = Topics.completeTopics(JSON.parse(JSON.stringify(client.topics.publish)), client);
        }
      }

      if (client.msgTypes) {
        client.msgTypes = msgTypes;
      }
    } // if project.clients[clientId]
  } // for each client

  // Now that the clients are complete, copy them into the client.clients
  for (var clientId in project.clients) {
    var client = project.clients[clientId]
    if (client && client.clients) {
      for (var clientId2 in client.clients) {
        if (clientId2 === 'administrator') {
          client.clients.administrator = {
            clientId: global.aaa.clientId,
            name: global.aaa.name,
          }
        } else if (clientId2 === 'all') {
          // Ignore all
        } else {
          if (project.clients[clientId2]) {
            client.clients[clientId2] = JSON.parse(JSON.stringify(project.clients[clientId2]))
          } else {
            msg(2, f, ERROR, `${clientId} - Client not found ${clientId2} in administrator config`);
          }
        }
      }
    } // if project.clients[clientId]
  } // for each client
}

const readConfig = () => {
  console.log('Read in administrator configuration')
  let ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${stageId}/administrator.yml`)
  global.aaa = YAML.safeLoad(ymlStr)
  global.aaa.ips = {}
  global.aaa.stageId = stageId
  global.aaa.clients = {}

// For each project in administrator config
  for (var projectId in global.aaa.projects) {
    let ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${stageId}/${projectId}/msgTypes.yml`)
    const msgTypes = YAML.safeLoad(ymlStr)
    for (var id in msgTypes) {
      msgTypes[id].typeId = id
    }
    var project = global.aaa.projects[projectId]

    initMetrics(projectId, project)
    initClients(projectId, project, msgTypes)
  } // for each project
}

readConfig();

// Complete the administrator subscribe and publish topics
global.aaa.topics.subscribe = Topics.completeTopics(global.aaa.topics.subscribe);
global.aaa.topics.publish = Topics.completeTopics(global.aaa.topics.publish);

console.log(f, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(processCB,'-');
console.log(f, 'Exit main thread')