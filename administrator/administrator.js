// File: administrator.js

/*

Get a list of all metrics from administrator

No, I'll know everything I need to identify a value
   projectId   RF
   instance    42
   metricId    LivingRoom_Desk_K_F
   sourceId
     inp
     hum
     out
     ala

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

const mqttNode  = require('./utils/mqttNode')
const {ckTopic, completeTopics, completeTopic}  = require('./utils/topics')
const metricValues = {}
const {msg} = require("./utils/msg")
const influx = require("./utils/influx")
const {currentDate} = require("./utils/tools")
const os = require('os')

const seedrandom  = require('seedrandom')
const clientId = "administrator"
var sourceIds;
const generator = seedrandom(Date.now())
const mqttClientId = `${clientId}_${generator().toString(16).slice(3)}`

const f = "administrator:main - "

var adminId = "none"
if (process.argv[2]) {
  adminId = process.argv[2]
} else {
  console.log('ERROR: No adminId specified')
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
 * Processes a request for a devices configuration - device, inp, out.
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
    msg(0, f, WARNING, 'Cannot find client', id)
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
  console.log('Restarting the program...');
  // You can perform any necessary cleanup or configuration here before restarting
  const exec = require('child_process').exec;
  exec('node your_program.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error while restarting: ${error}`);
    }
  });
  process.exit(); // Exit the current process
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

const addMetricValues = (processId, metricId, sourceId, values) => {
  //   Process  Instance  MetricId  SourceIdunc - inp, out, hum
  if (!metricValues?.[processId]?.[metricId]?.[sourceId]) {
    if (!(processId in metricValues)) {
      metricValues[processId] = {[metricId]: {[sourceId]: {}}}
    } else if (!(metricId in metricValues[processId])) {
      metricValues[processId][metricId] = {[sourceId]: {}}

    } else if (!(sourceId in metricValues[processId][metricId])) {
      metricValues[processId][metricId][sourceId] = {}
    }
  }

  for (var key in values) {
    metricValues[processId][metricId][sourceId][key] = {
      val: values[key],
      date: Date.now(),
    }
  }
}


//  output to MQTT all values of a metric
const publishMetricValues = (processId, metricId, clientId) => {
  // publish values
  // topic PROCESSID/rsp/clientId
  var mv;
  if (mv = metricValues[metricId][processId]) {
    var payload = {}
    if (mv.stale)  { payload['stale'] = mv.stale}
    if (mv.status) { payload['status'] = mv.status}
    if (mv.value)  { payload['value'] = mv.value}
    if (mv.high)   { payload['high'] = mv.high}
    if (mv.low)    { payload['low'] = mv.low}
    if (mv.upper)  { payload['upper'] = mv.upper }
    if (mv.lower)  { payload['lower'] = mv.lower }

    var outTopic = `${processId}/rsp/${clientId}`
    var outStr = JSON.stringify(payload)
    msg(1,f, DEBUG,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
    mqttNode.publish(outTopic, outStr);
  } else {


  }
}

const processMqttInput = (_topic, _payload) => {
  // Values array - Save by
  //   ProcessId - cb, oxy
  //     MetricId
  //       SourceId - inp, out, hum
  //         val
  //         datetime
  var [processId,sourceId,...rest] = _topic.split('/')
  processId = processId.toLowerCase()
  sourceId = sourceId.toLowerCase()


  var payload = _payload.toString()
  var flds = payload.split(' ')
  var values = {}


  // Extract metricId from tags
  var metricId
  var tags = flds[0].split(',')
  for (var t = 1; t < tags.length; t++) {
    var [key, val] = tags[t].split('=')
    key = key.toLowerCase();
    if (key === "metricid") {
      metricId = val.toLowerCase()
      break;
    }
  }

  console.log('processMqttInput - payload - ' + payload)

  // Extract values into values array
  var ivalues = flds[1].split(',')
  for (var v = 0; v < ivalues.length; v++) {
    var [key, val] = ivalues[v].split('=')
    values[key.toLowerCase()] = val
  }

  // Add to metricValues array
  addMetricValues(processId, metricId, sourceId, values)
//var status = checkMetricStatus()

  return ['', null];
}

const getMetricValues = (processId, metricId, sourceId, valueId) => {
  const f = 'administrator::getMetricValues'
  var vp, vm, vs, vv;
  var processId = (args.processId) ? args.processId.toLowerCase() : null
  var metricId  = (args.metricId)  ? args.metricId.toLowerCase()  : null
  var sourceID  = (args.sourceId)  ? args.sourceId.toLowerCase()  : null
  var valueId   = (args.valueId)   ? args.valueId.toLowerCase()   : null
  if (processId) {
    if (!(vp = metricValues[processId])) {
      msg(0,f, ERROR,"Cannot find processID - ", processId)
      return null;
    }
    if (metricId) {
      if (!(vm = metricValues[processId][metricId])) {
        msg(0,f, ERROR,"Cannot find metricId - ", processId + ' ' + metricId)
        return null;
      }
      if (sourceId) {
        if (!(vs = metricValues[processId][metricId][sourceId])) {
          msg(0,f, ERROR,"Cannot find sourceId - ", processId+ ' ' + metricId + ' ' + sourceId)
          return null;
        }
        if (valueId) {
          if (!(vv = metricValues[processId][metricId][sourceId][valueId])) {
            msg(0,f, ERROR,"Cannot find valueId- ", processId+ ' ' + metricId + ' ' + sourceId + ' ' + valueId)
            return null;
          }
          return vv
        } else {
          return vs
        }
      } else {
        return vm
      }
    } else {
      return vp
    }
  } else {
    return metricValues
  }
}


const processCmd = (_topic, payload) => {
  var id = (payload.clientId) ? payload.clientId : payload.ip
  var outTopic = global.aaa.topics.publish.rsp;
  outTopic = outTopic.replace(/DCLIENTID/, id)

  var out = JSON.parse(JSON.stringify(payload))
  out.rsp = out.cmd
  delete out.cmd

  if (clientId === global.aaa.clientId || clientId === 'all') {  // commands specifically for the server
    if (payload.cmd === 'setDebugLevel') {
      global.aaa.status.debugLevel = payload.debugLevel;
    // Request to reset administrator client
    } else if (payload.cmd === 'requestReset') {
      out = resetServer();
    // Request for status
    } else if (payload.cmd === 'requestStatus') {
      out = getStatus();
    } else if (payload.cmd === 'requestConfig') {
      loadAdministratorConfig(); // Start with a fresh config every time
      if (payload.type === 'hmi') {
        out = loadHmiConfig(payload)
      } else if (payload.type === 'mqtt') {
        out = loadMqttConfig(payload)
      } else {  // edge and older clients
        out = loadEdgeConfig(payload)
      }
      if (out) {  // Add status for this client
        addStatus(out)
      }
    } else if (payload.cmd === 'getMetricValues') {
      out.values = getMetricValues(payload.processId, payload.metricId, payload.sourceId, payload.valueId)
    } else if (payload.cmd === 'requestJsonFile') {
      msg(2, f, DEBUG, "Read json file: ", filepath)
      const filepath = `${process.env.ROOT_PATH}/${payload.filepath}`
      const data = fs.readFileSync(filepath);
      out = JSON.parse(data)
    } else if (payload.cmd === 'requestYmlFile') {
      const filepath = `${process.env.ROOT_PATH}/${payload.filepath}`
      msg(2, f, DEBUG, "Read yml file: ", filepath)
      out = YAML.safeLoad(fs.readFileSync(filepath));
    }
  }
  return [outTopic, out]
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

  if (inp.inp) {
    out.inp = {}
    for (var metricId in inp.inp) {
      var metric = inp.inp[metricId]
      out.inp[metricId] = {
        input: metric.inp,
        decimals: metric.decimals,
        value: 0
      }
    }
  }

  if (inp.out) {
    out.out = {}
    for (var metricId in inp.out) {
      var metric = inp.out[metricId]
      out.out[metricId] = {
        output: metric.out,
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
//console.log(f, 'enter', _topic);
  var out;
  var outTopic;
  try {
    var compress = false
    var [,sourceId, clientId,,] = _topic.split('/')

    const inputStr = _payload.toString();
    msg(1,f,DEBUG, 'topic: ', _topic, '\n' + ' payload:', inputStr);
    var input = {}

    // If the payload is JSON, parse it
    if (inputStr && inputStr[0] === '{' && inputStr !== '{}') {
      try {
        msg(3, f, DEBUG, "Parse inputStr:", inputStr.toString)
        input = JSON.parse(inputStr)
      } catch(err) {
        msg(0,f,ERROR, 'Error parsing JSON -- ',inputStr)
        return;
      }
    }
    msg(3,f,DEBUG, 'sourceId', sourceId, ' clientId', clientId);

    // If this is a cmd to the administrator
    if (global.aaa.topics.subscribe['cmd'] === _topic ||
        global.aaa.topics.subscribe['all'] === _topic) {
      if (input.cmd) {
        [outTopic, out] = processCmd(_topic, input);
      }
    // If this is a response from one of the client Id's
    } else if (_topic.indexOf(ckTopic("subscribe","rsp").replace(/\/#/,'')) > -1) {
      if (input.rsp === 'requestStatus')  {
        global.aas.clients[clientId] = input
      } else if (input.rsp === 'setDebugLevel') {
        global.aas.clients[clientId].debugLevel = input.debugLevel
      } else if (input.rsp === 'setEnabled') {
        global.aas.clients[clientId].enabled = input.enabled
      }
    // If this is inp, out, hum influx data then update values in the metricValues array
    } else if (sourceId === 'inp' || sourceId === 'out' || sourceId === 'hum') {
      [outTopic, out] = processMqttInput(_topic,inputStr)
    }
    var short = global.aaa.topics.subscribe.rsp.replace(/\/#/,'')
    var ind = _topic.indexOf(short)

    if (out) {
      out.rsp = input.cmd;
      out.date = currentDate()
      var outStr = JSON.stringify(out)
      msg(1,f, DEBUG,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
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


const loadClientMetrics = (_client) => {
  // for each projecgt
  for (var projectId in global.aaa.projects) {
    var project = global.aaa.projects[projectId]
    // Read in all the metrics/*.yml files for this project
    var dirPath = `${process.env.ROOT_PATH}/${adminId}/projects/${projectId}/metrics`
    var files = fs.readdirSync(dirPath);

    // for each file in this projects
    files.forEach(filename => {
      if (path.extname(filename) == '.yml') {
        var filepath = dirPath + '/' + filename;
        var metrics = YAML.safeLoad(fs.readFileSync(filepath));
        for (orgMetricId in metrics) {
          ``
          // Change metric key to all small letters - save org name to metric.name
          var metric = metrics[orgMetricId]
          metric.name = orgMetricId
          metric.metricId = orgMetricId.toLowerCase();  // Change key to lower case
          var metricId = metric.metricId

          metric.projectId = projectId                // add projectId to each metric
          var flds = orgMetricId.split('_')
          metric.units = flds[flds.length - 1]

          var args = {
            "clientId": _client.clientID,
            "projectId": projectId,
            "telegrafId": project.telegrafId,
          }
          if (metric.inp && metric.inp.clientId === _client.clientId) {
            if (!_client.inp) _client.inp = {}
            metric.inp.tags = influx.makeTagsFromMetricId(metric.name, "inp", projectId)
            metric.inp.topic = completeTopic(_client.topics.publish.inp, args)
            _client.inp[metricId] = metric
          }

          if (metric.out && metric.out.clientId === _client.clientId) {
            if (!_client.out) _client.out = {}
            metric.out.tags = influx.makeTagsFromMetricId(metric.name, "out", projectId)
//          metric.out.topic = completeTopic(_client.topics.publish.out, args)
            _client.out[metricId] = metric
          }

          if (metric.hum && metric.hum.clientId === _client.clientId) {
            if (!_client.hum) _client.hum = {}
            metric.hum.tags = influx.makeTagsFromMetricId(metric.name, "hum", projectId)
            metric.hum.topic = completeTopic(_client.topics.publish.hum, args)
            _client.hum[metricId] = metric
          }
        }
      }
    });
  }
}

const readSourceIds = () => {
  var ymlStr
  var filepath
  var sourceIds
  try {
    filepath = `${process.env.ROOT_PATH}/${adminId}/hmi/sourceIds.yml`
    ymlStr = fs.readFileSync(filepath)
    sourceIds = YAML.safeLoad(ymlStr)
    for (var id in sourceIds) {
      sourceIds[id].typeId = id
    }

  } catch(err) {
    msg(0,f,ERROR,err,filepath);
  }
  return sourceIds
}

/*
const initClients = (projectId, instance, project, sourceIds) => {
  // For each client create lookup lists by clientId and IP
  var c
  for (c in project.clients) {
    if (project.clients[c] !== "enabled") {
      delete project.clients[c]
      continue;
    }

    if (client.sourceIds) {
      client.sourceIds = sourceIds;
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
*/

const loadProject = (projectId) => {
  const f = "adminisgtrator::loadProject - "
  try {
    var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/projects/${projectId}/project.yml`)
    return YAML.safeLoad(ymlStr)
  } catch(err) {
    msg(0,f,ERROR,"Error loading project.yml file: ", projectId, ' - ', err);
  }
}

const loadAdministratorConfig = () => {
  var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/administrator.yml`)
  var conf = YAML.safeLoad(ymlStr)
  conf.status    = global.aaa.status
  conf.startTime = global.aaa.startTime
  global.aaa = conf
  global.aaa.ips = {}
  global.aaa.adminId = adminId

  global.aam = global.aaa.mqtt
  global.aam.mqttClientId = mqttClientId

// Complete the administrator subscribe and publish topics
  if (global.aaa.topics.subscribe) {
    global.aaa.topics.subscribe = completeTopics(global.aaa.topics.subscribe,{
      "clientId": "administrator",
    });
  }
  if (global.aaa.topics.register) {
    global.aaa.topics.register = completeTopics(global.aaa.topics.register, {
      "clientId": "administrator",
    });
  }
  if (global.aaa.topics.publish) {
    global.aaa.topics.publish = completeTopics(global.aaa.topics.publish, {
      "clientId": "administrator",
    });

  }
  for (var projectId in global.aaa.projects) {
    if (global.aaa.projects[projectId] === "enabled") {
      global.aaa.projects[projectId] = loadProject(projectId)
    } else {
      delete global.aaa.projects[projectId]
    }
  }

  sourceIds = readSourceIds()
}

const loadClient = (_dir, _clientId, _projectId) => {
  const f = 'administrator::loadClient'
  var client;
  try {
    var filepath = `${process.env.ROOT_PATH}/${adminId}/${_dir}/${_clientId}.yml`
    var ymlStr = fs.readFileSync(filepath)
    client = YAML.safeLoad(ymlStr)
    client.clientId = _clientId

    global.aaa.clients[_clientId] = client;
    if (client.ip) {
      global.aaa.ips[client.ip] = client;
    }

    if (client.topicSet) {
      client.topics = JSON.parse(JSON.stringify(global.aaa.topicSets[client.topicSet]))
    }
    var args = {
      'clientId': client.clientId,
      'userId': 'UNK',
      'projectId': _projectId
    }
    if (client.topics.subscribe) {
      client.topics.subscribe = completeTopics(JSON.parse(JSON.stringify(client.topics.subscribe)), args);
    }
    if (client.topics.publish) {
      client.topics.publish   = completeTopics(JSON.parse(JSON.stringify(client.topics.publish)), args);
    }
    if (client.topics.register) {
      client.topics.register  = completeTopics(JSON.parse(JSON.stringify(client.topics.register)), args);
    }

    if (client.sourceIds) {
      client.sourceIds = sourceIds
    }
  } catch(err) {

  }

  return client
}

const findClientByIp = (_dir, _ip, _projectId) => {
  const f = 'administrator::findClientByIp'
  try {
    for (var clientId in global.aaa.clients) {
      if (clientId !== "all" && global.aaa.clients[clientId] === "enabled") {
        var client = loadClient(_dir, clientId, _projectId)
        if (client.ip === _ip) {
          return client;
        }
      }
    }
  } catch(err) {
    msg(0,f,ERROR,"Reading client file ", clientId, ' - ', err);
  }
}

const loadEdgeConfig = (_payload) => {
  console.log('Read in administrator configuration')

  if (!_payload.clientId && !_payload.ip) {
    msg(0,f,ERROR,"neither the clientId or ip is defined");
    return
  }
  var client
  if (_payload.ip) {
    id = _payload.ip
    client = findClientByIp("clients", _payload.ip, _payload.projectId)
  } else {
    id = _payload.clientId
    client = loadClient("clients", _payload.clientId, _payload.projectId)
  }
  if (!client) {
    msg(0, f, ERROR, "Client not found", id);
    return;
  }

  loadClientMetrics(client)
  return client
}

const loadMqttConfig = (_payload) => {
  var client = loadClient("clients", _payload.clientId, _payload.projectId)
  for (var clientId in client.clients) {
    if (clientId !== "all") {
      if (client.clients[clientId] !== "enabled") {
        delete client.clients[clientId]
        continue;
      }
      var dir = (clientId === "administrator") ? "." : "clients"
      client.clients[clientId] = loadClient(dir, clientId, "UNK")
      var nc = client.clients[clientId]
      delete nc.topics
      delete nc.clients

    }
  }
  return client;
}

const loadHmiConfig = (_payload) => {
  var client = loadClient("clients", _payload.clientId, _payload.projectId)
  return client;
}

loadAdministratorConfig();

console.log(f, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(connectCB, processCB);
console.log(f, 'Exit main thread')
