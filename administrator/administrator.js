// File: administrator.js

/*

Get a list of all metrics from administrator

No, I'll know everything I need to identify a value
   projectId   RF
   instance    42
   metricId    LivingRoom_Desk_K_F
   Source
     I input
     H human
     O output
     A alarm

Functions
   GetValue
   SetValue
   Upon receipt of IOHA
      if new value is out of alarm
        if alarm == false
           Post alarm OFF message to mqtt
           Set alarm true
      else if new value is ok
        If alarm == true
          Post alarm ON message to mqtt
          Set Alarm false
*/



const fs = require('fs')
const YAML = require('yaml-parser')
const path = require('path')
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

var adminId = "none"
if (process.argv[2]) {
  adminId = process.argv[2]
} else {
  console.log('ERROR: No adminId specified');
  process.exit(1);
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

const compressConfig = (inp) => {
  var out = {
    clientId: inp.clientId,
    projectID: inp.projectID,
    instance: inp.instance,
    topics: inp.topics,
    ip: inp.ip,
    status: inp.status,
    rsp: inp.rsp,
  }

  if (inp.inputs) {
    out.inputs = {}
    for (var metricId in inp.inputs) {
      var metric = inp.inputs[metricId]
      out.inputs[metricId] = {
        input: metric.input,
        decimals: metric.decimals,
        value: 0
      }
    }
  }

  if (inp.outputs) {
    out.outputs = {}
    for (var metricId in inp.outputs) {
      var metric = inp.outputs[metricId]
      out.outputs[metricId] = {
        output: metric.output,
        decimals: metric.decimals,
        value: 0
      }
    }
  }


  return out
}

/**
 * processCB
 */
const processCB = (_topic, _payload) => {
  const f = 'administrator::processCB'
  msg(1,f,DEBUG, 'enter');
  console.log(f, 'enter', _topic);
  var out;
  var outTopic;
  var dclientId;
  try {
    var compress = false
    var [projectId, instance, func, clientId, userId, telegrafId] = _topic.split('/')

    const inputStr = _payload.toString();
    var input = {}

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
            if (out.model == 'arduino') {
              out = compressConfig(out);
              compress = true
            }
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
      if (!compress) {
        out.date = currentDate()
      }
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
  // Read in all the metrics/*.yml files for this project
  var dirPath = `${process.env.ROOT_PATH}/${adminId}/${projectId}/metrics`
  var files = fs.readdirSync(dirPath);
  project.metrics = {}
  files.forEach(filename => {
    if (path.extname(filename) == '.yml') {
      var filepath = dirPath + '/' + filename;
      var metrics = YAML.safeLoad(fs.readFileSync(filepath));
      for (metric in metrics) {
        project.metrics[metric] = metrics[metric]
      }
    }
  });
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
        if (!client.inputs) {
          client.inputs = {}
        }
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
  var c
  for (c in project.clients) {
    if (project.clients[c] !== "enabled") {
      delete project.clients[c]
      continue;
    }

    var filepath = `${process.env.ROOT_PATH}/${adminId}/${projectId}/clients/${c}.yml`
    var ymlStr = fs.readFileSync(filepath)
    var client = YAML.safeLoad(ymlStr)
    project.clients[c] = client
    client.clientId = c
    client.projectId = projectId
    client.instance = instance;

    global.aaa.clients[c] = client;
    if (client.ip) {
      global.aaa.ips[client.ip] = client;
    }

    if (client.topics) {
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
  }

// Now that the clients are complete, copy them into client.clients
  for (c in project.clients) {
    var client = project.clients[c]
    if (client && client.clients) {
      for (var c2 in client.clients) {
        if (c2 === 'administrator') {
          client.clients.administrator = {
            clientId: global.aaa.clientId,
            name: global.aaa.name,
          }
        } else if (c2 === 'all') {
          // Ignore all
        } else {
          if (project.clients[c2]) {
            client.clients[c2] = JSON.parse(JSON.stringify(project.clients[c2]))
            addStatus(client.clients[c2])
          } else {
            delete client.clients[c2]
            msg(2, f, ERROR, `${c} - Client not found ${c2} in administrator config`);
          }
        }
      }
    } // if project.clients[c]
  } // for each client
}

const loadConfig = () => {
  console.log('Read in administrator configuration')

  var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/administrator.yml`)

  var conf = YAML.safeLoad(ymlStr)
  conf.status    = global.aaa.status
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
    if (global.aaa.projects[projectId] === 'enabled') {
      var ymlStr
      var filepath
      var funcIds
      try {
        filepath = `${process.env.ROOT_PATH}/${adminId}/${projectId}/hmi/funcIds.yml`
        ymlStr = fs.readFileSync(filepath)
        funcIds = YAML.safeLoad(ymlStr)
        for (var id in funcIds) {
          funcIds[id].typeId = id
        }

      } catch(err) {
        msg(0,f,ERROR,err,filepath);
      }

      try {
        ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/${projectId}/project.yml`)
        var project = YAML.safeLoad(ymlStr)
        initClients(projectId, project.instance, project, funcIds)
        initMetrics(projectId, project.instance, project)
        for (var c in project.clients) {
          var client = project.clients[c]
          if (client.metrics && client.metrics === 'project') {
            client.metrics = project.metrics
          }
        }
      } catch(err) {
        msg(0,f,ERROR,err,filepath);
      }

    } else {
      delete global.aaa.projects[projectId]
    }
  } // for each project
}

loadConfig();

console.log(f, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(connectCB, processCB);
console.log(f, 'Exit main thread')