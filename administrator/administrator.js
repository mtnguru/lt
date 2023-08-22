// File: administrator.js
const fs = require('fs')
const YAML = require('yaml-parser')
require('dotenv').config();

const mqttNode  = require('./utils/mqttNode');
const Topics  = require('./utils/topics');
const {msg} = require("./utils/msg");
const influx = require("./utils/influx");
const {currentDate} = require("./utils/tools");
const os = require('os')

const seedrandom  = require('seedrandom')
const clientId = "administrator"
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3)}`

const f = "administrator:main - "

const adminId = "none"
if (process.argv[2]) {
  adminId = process.argv[2]
} else {
  console.log('ERROR: No adminId specified');
  exit(1);
}

// global.aaa is overwritten when the configuration is read in from a file
global.aaa = {
  startTime: Date.now(),
  status: {
    debugLevel: 0,
    mqttConnected: 0,
    mqttSubscribed: 0,
    mqttUnsubscribed: 0,
  }
}

/* Use the administrator.yml file instead
// MQTT configuration - this will be the same for all clients except the port
global.aam = {
  mqttClientId: mqttClientId,
  url: "http://historian:1883",    // labtime linode computer
//url: "http://172.16.45.7:1883",    // merlin
//url: "http://192.168.122.90:1883",
  username: "data",
  password: "datath",
  protocol: 'MQTT',
//protocolVersion: 4,
  connectTimeout: 60000,
  reconnectPeriod: 120000,
  keepAlive: 5000,
}
*/

// Keeps status of all the clients for their initialization
// populated when 'administrator' is started and queries clients for their status
global.aas = {
  clients: {},
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

const getStatus = () => {
  var timeDiff = parseInt((Date.now() - global.aaa.startTime) / 1000)
  var seconds = Math.round(timeDiff % 60)
  timeDiff = Math.floor(timeDiff / 60)
  var minutes = Math.round(timeDiff % 60)
  timeDiff = Math.floor(timeDiff / 60)
  var hours = Math.round(timeDiff % 24)
  timeDiff = Math.floor(timeDiff / 24)
  var days = timeDiff

  var uptime = ''
  if (days > 0) {
    uptime = `${days} `
  }
  uptime += `${hours}:${minutes}:${seconds}`

  return {
    rsp: "requestStatus",
    clientId: clientId,
    mqttClientId: mqttClientId,
    mqttConnected: global.aaa.status.mqttConnected,
    mqttSubscribe: global.aaa.status.mqttSubscribe,
    mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
    hostname: os.hostname(),
    debugLevel: global.aaa.status.debugLevel,
    uptime: uptime,
  }
}

const resetServer = () => {
  var out = {
    rsp: "requestReset",
    clientId: global.aaa.clientId,
    msg: `Resetting ${global.aaa.clientId}`
  }
  mqttNode.unsubscribe(global.aaa.topics.subscribe)
  mqttNode.subscribe(global.aaa.topics.subscribe)
  return out;
}

const connectCB = () => {
  // Request status from all clients
  mqttNode.publish(global.aaa.topics.publish.all,`{"cmd": "requestStatus", "clientId": "all"}`)
}

const addStatus = (out) => {
  if (global.aas.clients[out.clientId]) {
    out.status = global.aas.clients[out.clientId]
    if (!'debugLevel' in out.status && 'debugLevel' in out.statusDefault) {
      out.status.debugLevel     = out.statusDefault.debugLevel;
    }
    if (!'enabled' in out.status    && 'enabled' in out.statusDefault) {
      out.status.enabled = out.statusDefault.enabled;
    }
    if (!'sampleInterval' in out.status && 'sampleInterval' in out.statusDefault) {
      out.status.sampleInterval = out.statusDefault.sampleInterval;
    }
  } else {
    out.status = {}
    if ('debugLevel' in out.statusDefault) {
      out.status.debugLevel = out.statusDefault.debugLevel
    }
    if ('enabled' in out.statusDefault) {
      out.status.enabled = out.statusDefault.enabled
    }
    if ('sampleInterval' in out.statusDefault) {
      out.status.sampleInterval = out.statusDefault.sampleInterval
    }
  }
}

/**
 * processCB
 */
const processCB = (_topic, _payload) => {
  const f = 'administrator::processCB'
  msg(1,f,DEBUG, 'enter');
  console.log(f, 'enter', _topic);
  let out;
  let outTopic;
  var dclientId;
  try {
    var [projectId, instance, func, clientId, userId, telegrafId] = _topic.split('/')

    const inputStr = _payload.toString();
    let input = {}

    // If the payload is JSON, parse it
    if (inputStr && inputStr !== '{}') {
      msg(3,f, DEBUG,"Parse inputStr:", inputStr.toString)
      input = JSON.parse(inputStr)
    }
    msg(3,f,DEBUG, 'func', func, ' clientId', clientId);

    // If this is a cmd to the administrator
    if (global.aaa.topics.subscribe['cmd'] === _topic ||
        global.aaa.topics.subscribe['all'] === _topic) {
      if (input.cmd) {
        if (clientId === global.aaa.clientId || clientId === 'all') {  // commands specifically for the server
          if (input.cmd === 'setDebugLevel') {
            global.aaa.status.debugLevel = input.debugLevel;
          }
          // Request to reset administrator client
          if (input.cmd === 'requestReset') {
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, global.aaa.clientId)
            out = resetServer();
          }
          // Request for status
          if (input.cmd === 'requestStatus') {
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, global.aaa.clientId)
            out = getStatus();
          }
          if (input.cmd === 'requestConfig') {
            loadConfig();
            var id = (input.ip) ? input.ip : input.clientId
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, id)
            out = findClient(id)
            addStatus(out)
          }
          if (input.cmd === 'requestJsonFile') {
            msg(2, f, DEBUG, "Read json file: ", filepath)
            dclientId = (input.ip) ? input.ip : input.clientId
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, dclientId)

            const filepath = `${process.env.ROOT_PATH}/${input.filepath}`
            const data = fs.readFileSync(filepath);
            out = JSON.parse(data)
          }
          if (input.cmd === 'requestYmlFile') {
            dclientId = (input.ip) ? input.ip : input.clientId
            outTopic = global.aaa.topics.publish.rsp
            outTopic = outTopic.replace(/DCLIENTID/, dclientId)

            const filepath = `${process.env.ROOT_PATH}/${input.filepath}`
            msg(2, f, DEBUG, "Read yml file: ", filepath)
            out = YAML.safeLoad(fs.readFileSync(filepath));
          }
        }
      }
    } else if (_topic.indexOf(global.aaa.topics.subscribe.rsp.replace(/\/#/,'')) > -1) {
      if (input.rsp === 'requestStatus')  {
        global.aas.clients[clientId] = input
      } else if (input.rsp === 'setDebugLevel') {
        global.aas.clients[clientId].debugLevel = input.debugLevel
      } else if (input.rsp === 'setEnabled') {
        global.aas.clients[clientId].enabled = input.enabled
      }
    }
    var short = global.aaa.topics.subscribe.rsp.replace(/\/#/,'')
    var ind = _topic.indexOf(short)

    if (out) {
      out.rsp = input.cmd;
      out.date = currentDate()
      var outStr = JSON.stringify(out)
      msg(0,f, DEBUG,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
      mqttNode.publish(outTopic, outStr);
    }
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

const initMetrics = (projectId, instance, project) => {
  // Read in the metrics for this project
  var filepath = `${process.env.ROOT_PATH}/${adminId}/${projectId}/metrics.yml`
  project.metrics = YAML.safeLoad(fs.readFileSync(filepath));
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
        metric.input.tags = influx.makeTagsFromMetricId(metric.name, "I", projectId, instance)
      }
    }
    if (metric.output) {
      if (client = project.clients[metric.output.clientId]) {
        if (!client.outputs) client.outputs = {}
        client.outputs[metricId] = metric
        metric.output.tags = influx.makeTagsFromMetricId(metric.name, "O", projectId, instance)
      }
    }
    if (metric.human) {
      if (client = project.clients[metric.human.clientId]) {
        if (!client.humans) client.humans = {}
        client.humans[metricId] = metric
        metric.human.tags = influx.makeTagsFromMetricId(metric.name, "H", projectId, instance)
      }
    }
  } // for each metric in project
}

const initClients = (projectId, instance, project, funcIds) => {
  // For each client create lookup lists by clientId and IP
  for (var clientId in project.clients) {
    var client = project.clients[clientId]
    if (client) {
//    var flds = metric.name.split('_')
      client.clientId = clientId
      client.projectId = projectId
      client.instance = instance;

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
          if (topics.subscribe) {
            client.topics.subscribe = Topics.completeTopics(JSON.parse(JSON.stringify(topics.subscribe)), client);
          }
          if (topics.publish) {
            client.topics.publish   = Topics.completeTopics(JSON.parse(JSON.stringify(topics.publish)), client);
          }
          if (topics.register) {
            client.topics.register  = Topics.completeTopics(JSON.parse(JSON.stringify(topics.register)), client);
          }
        } else {
          if (client.topics.subscribe) {
            client.topics.subscribe = Topics.completeTopics(JSON.parse(JSON.stringify(client.topics.subscribe)), client);
          }
          if (client.topics.publish) {
            client.topics.publish   = Topics.completeTopics(JSON.parse(JSON.stringify(client.topics.publish)), client);
          }
          if (client.topics.register) {
            client.topics.register  = Topics.completeTopics(JSON.parse(JSON.stringify(client.topics.register)), client);
          }
        }
      }

      if (client.funcIds) {
        client.funcIds = funcIds;
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
            addStatus(client.clients[clientId2])
          } else {
            msg(2, f, ERROR, `${clientId} - Client not found ${clientId2} in administrator config`);
          }
        }
      }
    } // if project.clients[clientId]
  } // for each client
}

const loadConfig = () => {
  console.log('Read in administrator configuration')
  let ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/administrator.yml`)

  var conf = YAML.safeLoad(ymlStr)
  conf.status = global.aaa.status
  conf.startTime = global.aaa.startTime
  global.aaa = conf
  global.aaa.ips = {}
  global.aaa.adminId = adminId
  global.aaa.clients = {}

  global.aam = global.aaa.mqtt
  global.aam.mqttClientId = mqttClientId

// Complete the administrator subscribe and publish topics
  if (global.aaa.topics.subscribe) {
    global.aaa.topics.subscribe = Topics.completeTopics(global.aaa.topics.subscribe);
  }
  if (global.aaa.topics.register) {
    global.aaa.topics.register = Topics.completeTopics(global.aaa.topics.register);
  }
  if (global.aaa.topics.publish) {
    global.aaa.topics.publish = Topics.completeTopics(global.aaa.topics.publish);
  }

// For each project in administrator config
  for (var projectId in global.aaa.projects) {
    let ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/${projectId}/funcIds.yml`)
    const funcIds = YAML.safeLoad(ymlStr)
    for (var id in funcIds) {
      funcIds[id].typeId = id
    }
    var project = global.aaa.projects[projectId]

    initMetrics(projectId, project.instance, project)
    initClients(projectId, project.instance, project, funcIds)
  } // for each project
}

loadConfig();

console.log(f, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(connectCB, processCB);
console.log(f, 'Exit main thread')
