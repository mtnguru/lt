
const fs = require('fs')
const YAML = require('yaml-parser')
const path = require('path')
require('dotenv').config()

const mqttNode  = require('./utils/mqttNode')
const {ckTopic, completeAllTopics, completeTopic, ActionIds}  = require('./utils/topics')
const {
  addMetricValues,
  checkMetricValues,
  publishMetricValues,
  getMetricV,
  setDefaults,
  haveValue,
}  = require('./utils/v')

const {msg, msgE, setDebugLevel} = require("./utils/msg")
const influx = require("./utils/influx")
const {currentDate} = require("./utils/tools")
const os = require('os')

const seedrandom  = require('seedrandom')
const clientId = "administrator"
const generator = seedrandom(Date.now())

var actionIds;

const fm = "administrator:main - "


var adminId = "none"
if (process.argv[2]) {
  adminId = process.argv[2]
} else {
  console.log('msgE.error: No adminId specified')
  process.exit(1);
}

const mqttClientId = `${clientId}_${adminId}_${generator().toString(16).slice(10)}`

// global.aaa is overwritten when the configuration is read in from a file
global.aaa = {
  startTime: Date.now(),
  status: {
    debugLevel: 1,
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
  connectTimeout: 5000,
  reconnectPeriod: 5000,
  keepAlive: 60,
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
  msg(2,f,msgE.error,'enter',id);

  // Find the client first by clientId, then by searching the IP's of all devices.
  var client;
  if (global.aaa.clients[id]) {
    client = global.aaa.clients[id]
  }
  if (global.aaa.ips[id]) {
    client = global.aaa.ips[id]
  }
  if (!client) {
    msg(0, f, msgE.warning, 'Cannot find client', id)
    return null;
  }
  msg(2,f,msgE.error, 'exit');
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
    clientId: global.aaa.clientId,
    userId: global.aaa.userId,
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
  // Reload the configuration
  loadAdministratorConfig(); // Start with a fresh config every time

  // Disconnect and reconnect to mqtt broker

  /* restart the program - does this work outside of webstorm
  console.log('Restarting the program...');
  const exec = require('child_process').exec;
  exec('node your_program.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error while restarting: ${error}`);
    }
  });
  process.exit(); // Exit the current process
  */
}

const connectCB = () => {
  // Request status from all clients
  mqttNode.publish(global.aaa.topics.publish.all,`{"cmd": "requestStatus", "clientId": "all"}`)
}

/**
 * addStatus - add client status information to client config
 * @param out
 */
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
 * processMqttInput - Add inp, hum, out values to V array
 *
 * @param _topic
 * @param _payload
 * @returns {[string,null]}
 */
const processMqttInput = (_topic, _payload) => {
  const f = 'administrator::processMqttInput'
  // V array - Save by
  //   _projectId - cb, oxy
  //     metricId
  //       actionId - inp, out, hum, upper, lower, high, low
  //         valueId = value
  //           val
  //           datetime
  //           userId
  try {
    var [projectId,actionId,clientId,userId,edgeId] = _topic.split('/')
    projectId = projectId.toLowerCase()
    actionId = actionId.toLowerCase()
    userId = (userId) ? userId.toLowerCase() : ''

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

    // Extract values into values array
    // Typically there is only one - "value"   However there can be more in rare cases
    msg(2,f, msgE.error,"payload - ", payload)
    var ivalues;
    if (flds[1] === undefined) {
      ivalues['value']
      msg(0,f, msgE.error,"no flds[1] === undefined " + metricId)
    } else {
      ivalues = flds[1].split(',')
    }
    for (var v = 0; v < ivalues.length; v++) {
      var [key, val] = ivalues[v].split('=')
      key = key.toLowerCase()
      values[key] = {
        val: val,
        date: Date.now(),
        userId: userId,
      }
    }

    // Add to V array
    addMetricValues(projectId, metricId, actionId, values, userId)
    checkMetricValues(projectId, metricId)
//var status = checkMetricStatus(projectId, metricId)
  } catch (err) {
    msg(0,f,msgE.error, 'Error processing Cmd -- ',err)
  }
  return ['', null];
}

const processCmd = (_topic, _payload) => {
  const f = 'administrator::processCmd'
  var id = (_payload.clientId) ? _payload.clientId : _payload.ip
  var outTopic = global.aaa.topics.publish.rsp;
  outTopic = outTopic.replace(/DCLIENTID/, id)
  var out = JSON.parse(JSON.stringify(_payload))
  out.rsp = out.cmd
  delete out.cmd

  try {
    if (clientId === global.aaa.clientId || clientId === 'all') {  // commands specifically for the server
      if (_payload.cmd === 'setDebugLevel') {
        setDebugLevel(_payload.debugLevel)
      } else if (_payload.cmd === 'requestReset') {
        out = resetServer();
      } else if (_payload.cmd === 'requestStatus') {
        outTopic = global.aaa.topics.publish.rsp;
        outTopic = outTopic.replace(/DCLIENTID/, global.aaa.clientId)
        out = getStatus();
      } else if (_payload.cmd === 'requestConfig') {
        loadAdministratorConfig(); // Start with a fresh config every time
        if (_payload.type === 'hmi') {
          out = loadHmiConfig(_payload)
        } else if (_payload.type === 'mqtt') {
          out = loadMqttConfig(_payload)
        } else {  // edge and older clients
          out = loadEdgeConfig(_payload)
        }
        if (out) {  // Add status for this client
          addStatus(out)
        }
      } else if (_payload.cmd === 'getMetric') {
        out.v = getMetricV(_payload.projectId, _payload.metricId, _payload.actionId, _payload.valueId)
      } else if (_payload.cmd === 'requestJsonFile') {
        msg(2, f, msgE.error, "Read json file: ", filepath)
        const filepath = `${process.env.ROOT_PATH}/${_payload.filepath}`
        const data = fs.readFileSync(filepath);
        out = JSON.parse(data)
      } else if (_payload.cmd === 'requestYmlFile') {
        const filepath = `${process.env.ROOT_PATH}/${_payload.filepath}`
        msg(2, f, msgE.error, "Read yml file: ", filepath)
        out = YAML.safeLoad(fs.readFileSync(filepath));
      }
    }
  } catch(err) {
    msg(0,f,msgE.error, 'Error processing Cmd -- ',err)
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
        val: 0
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
  msg(2,f,msgE.error, 'enter');
  var out;
  var outTopic;
  try {
    var compress = false
    var [,actionId, clientId,,] = _topic.split('/')

    const inputStr = _payload.toString();
    msg(2,f,msgE.error, 'topic: ', _topic, '\n' + ' payload:', inputStr);
    var input = {}

    // If the payload is JSON, parse it
    if (inputStr && inputStr[0] === '{' && inputStr !== '{}') {
      try {
        msg(3, f, msgE.error, "Parse inputStr:", inputStr.toString)
        input = JSON.parse(inputStr)
      } catch(err) {
        msg(0,f,msgE.error, 'Error parsing JSON -- ',inputStr)
        return;
      }
    }
    msg(3,f,msgE.error, 'actionId', actionId, ' clientId', clientId);

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
        if (clientId != "all") {
          global.aas.clients[clientId].debugLevel = input.debugLevel
        }
      } else if (input.rsp === 'setEnabled') {
        if (clientId != "all") {
          global.aas.clients[clientId].enabled = input.enabled
        }
      }
    // If this is inp, out, hum influx data then update values in the V array
    } else if (ActionIds.includes(actionId)) {
        var payload = inputStr.toString;
        [outTopic, out] = processMqttInput(_topic,inputStr)
    }
    var short = global.aaa.topics.subscribe.rsp.replace(/\/#/,'')
    var ind = _topic.indexOf(short)

    if (out) {
      out.mqttClientId = input.mqttClientId || mqttClientId
      out.rsp = input.cmd;
      out.date = currentDate()
      var outStr = JSON.stringify(out)
      msg(1,f, msgE.debug,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
      mqttNode.publish(outTopic, outStr);
    }
  } catch (err) {
    msg(0,f, msgE.error, 'shitter', input.rsp || input.cmd, err)
  }
  msg(2,f,msgE.error, 'exit');
  return null;
}

const findProject = (projectId) => {
  for (var id in global.aaa.projects) {
    if (id === projectId) {
      return global.aaa.projects[id]
    }
  }
}

const loadProjectMetrics = (_projectId) => {
  const f = 'administrator::loadProjectMetrics'
  const userId = 'default'
  // Read in all the metrics/*.yml files for this project
  var dirPath = `${process.env.ROOT_PATH}/${adminId}/projects/${_projectId}/metrics`
  var files = fs.readdirSync(dirPath);
  var metrics = {}

  try {
    // forEach file in CONF/ADMINID/PROJECTID/metrics with suffix .yml
    files.forEach(filename => {
      if (path.extname(filename) === '.yml') {
        var filepath = dirPath + '/' + filename;
        var fMetrics = YAML.safeLoad(fs.readFileSync(filepath));
        for (var id in fMetrics) {
          var fMetric = fMetrics[id]
          var metricId = id.toLowerCase();  // Change key to lower case
          if (metrics[metricId]) {   // Metric has already been created - add new data
            metric = metrics[metricId]
            for (var s in ActionIds) {
              const actionId = ActionIds[s]
              if (fMetric[actionId]) {
                metric[actionId] = fMetric[actionId]
              }
            }
          } else {  // Metric is new - copy in full record
            metrics[metricId] = metric = fMetrics[id]
            metric.name = id
            metric.metricId = id.toLowerCase()
            metric.projectId = _projectId                // add projectId to each metric
            var flds = id.split('_')
            metric.units = flds[flds.length - 1]
          }
          // Go through all ActionIds and update the V array with default values
          for (var s in ActionIds) {
            const actionId = ActionIds[s]
            var values = {}
            if (metric[actionId]) {
              if (haveValue(_projectId,metricId,actionId,'value')) {
                // do nothing?
              } else if (metric[actionId].default) {
                values = {
                  value: {
                    val: metric[actionId].default,
                    date: Date.now(),
                    userId: userId,
                    status: 'unk',
                    stale: 'unk',
                  },
                }
                addMetricValues(_projectId, metricId, actionId, values, userId)
                checkMetricValues(_projectId, metricId)
              }
            }
          }
        }
      }
    });
  } catch(err) {
    msg(0,f, msgE.error, err)
  }
  return metrics;
}

const getProjectMetrics = (_projectId, _client) => {
  const f = "adminisgtrator::getProjectMetrics - "
  var project = global.aaa.projects[_projectId]

  try {
    var metrics = loadProjectMetrics(_projectId)

    var args = {
      "projectId": _projectId,
      "msgId": project.msgId,
      "edgeId": project.edgeId,
    }

    // for each metricId/actionId - maketags and topics
    for (var metricId in metrics) {
      var metric = metrics[metricId]
      for (actionId of ActionIds) {
        if (metric[actionId]) {
          metric[actionId].tags = influx.makeTagsFromMetricId(metric.name, actionId, _projectId)
          metric[actionId].topic = completeTopic(_client.topics.publish[actionId], args)
          setDefaults(metric)
        }
      }
    }
  } catch(err) {
    msg(0,f, msgE.error, err)
  }
  return metrics;
}

const loadClientMetrics = (_client) => {
  const f = 'administrator::loadClientMetrics'
  try {
    for (var projectId in global.aaa.projects) {
      var project = global.aaa.projects[projectId]
      // Read in all the metrics/*.yml files for this project
      var dirPath = `${process.env.ROOT_PATH}/${adminId}/projects/${projectId}/metrics`
      var files = fs.readdirSync(dirPath);

      // forEach file in CONF/ADMINID/PROJECTID/metrics with suffix .yml
      files.forEach(filename => {
        if (path.extname(filename) === '.yml') {
          var filepath = dirPath + '/' + filename;
          var metrics = YAML.safeLoad(fs.readFileSync(filepath));
          for (orgMetricId in metrics) {
            ``
            // Change metric key to all small letters - save org name to metric.name
            var metric = metrics[orgMetricId]
            metric.name = orgMetricId
            metric.metricId = orgMetricId.toLowerCase();
            var metricId = metric.metricId

            metric.projectId = projectId                // add projectId to each metric
            var flds = orgMetricId.split('_')
            metric.units = flds[flds.length - 1]

            var project = global.aaa.projects[projectId]
            var args = {
              "clientId": _client.clientId,
              "projectId": projectId,
              "edgeId": project.edgeId,
              "messageId": project.messageId,
              "telegrafId": project.telegrafId,
            }
            for (actionId of ActionIds) {
              if (_client.topics.publish[actionId] && metric[actionId]) {
                if (metric[actionId] && metric[actionId].clientId === _client.clientId) {
                  metric[actionId].tags = influx.makeTagsFromMetricId(metric.name, "inp", projectId)
                  metric[actionId].topic = completeTopic(_client.topics.publish[actionId], args)
                  if (!_client[actionId]) _client[actionId] = []
                  // save metric in array - source
                  // @TODO - Add project Id - must also change edge client code.
                  // or don't add a new level and make this an array - I like this better
//                _client[actionId][metricId][projectId] = metric
                  _client[actionId].push(metric)
                }
              }
            }
          }
        }
      });
    }
  } catch (err) {
    msg(0,f, msgE.error, err)
  }
  // for each projectId
}

const readActionIds = () => {
  const f = "administrator::readActionIds"
  var ymlStr
  var filepath
  var actionIds
  try {
    filepath = `${process.env.ROOT_PATH}/${adminId}/hmi/actionIds.yml`
    ymlStr = fs.readFileSync(filepath)
    actionIds = YAML.safeLoad(ymlStr)
    for (var id in actionIds) {
      actionIds[id].typeId = id
    }

  } catch(err) {
    msg(0,f,msgE.error,err,filepath);
  }
  return actionIds
}

/*
const initClients = (projectId, instance, project, actionIds) => {
  const f = "administrator::initClients"
  // For each client create lookup lists by clientId and IP
  var c
  for (c in project.clients) {
    if (project.clients[c] !== "enabled") {
      delete project.clients[c]
      continue;
    }

    if (client.actionIds) {
      client.actionIds = actionIds;
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
            msg(2, f, msgE.error, `${c} - Client not found ${c2} in administrator config`);
          }
        }
      }
    } // if project.clients[c]
  } // for each client
}
*/

const loadProjectFile = (projectId) => {
  const f = "administrator::loadProjectFile - "
  try {
    var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/projects/${projectId}/project.yml`)
    var yml = YAML.safeLoad(ymlStr)
    yml.projectId = projectId
    return yml
  } catch(err) {
    msg(0,f,msgE.error,"Error loading project.yml file: ", projectId, ' - ', err);
  }
}

const loadAdministratorConfig = () => {
  const f = "administrator::loadAdministratorConfig"
  var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/clients/administrator.yml`)
  var conf = YAML.safeLoad(ymlStr)
  conf.status    = global.aaa.status
  conf.startTime = global.aaa.startTime
  global.aaa = conf
  global.aaa.ips = {}
  global.aaa.adminId = adminId

  global.aam = global.aaa.mqtt
  global.aam.mqttClientId = mqttClientId

// Complete the administrator subscribe and publish topics
  global.aaa.topics = completeAllTopics(global.aaa.topics,{ clientId: "administrator" })

  // load each project - delete disabled ones
  for (var projectId in global.aaa.projects) {
    if (global.aaa.projects[projectId] === "enabled") {
      global.aaa.projects[projectId] = loadProjectFile(projectId)
      global.aaa.projects[projectId].metrics = loadProjectMetrics(projectId)
    } else {
      delete global.aaa.projects[projectId]
    }
  }
  actionIds = readActionIds()
}

const loadClient = (_dir, _clientId, _projectId) => {
  const f = 'administrator::loadClient - '
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
    var project = global.aaa.projects[_projectId]
    if (!project) {
      project = {}
    }
    var args = {
      'clientId': client.clientId,
      'userId': client.userId || 'EDGE',
      'projectId': _projectId,
      'msgId': project.msgId,
      'edgeId': project.edgeId
    }
    client.topics = completeAllTopics(JSON.parse(JSON.stringify(client.topics)), args);

    if (client.actionIds) {
      client.actionIds = actionIds
    }
  } catch(err) {
    msg(0,f,msgE.error,"Error loading client ", _clientId, ' - ', err);
  }
  return client
}

const findClientByIp = (_dir, _ip, _projectId) => {
  const f = 'administrator::findClientByIp - '
  try {
    for (var clientId in global.aaa.clients) {
      if (clientId !== "all" && global.aaa.clients[clientId] === "enabled") {
        var client = loadClient(_dir, clientId, _projectId)
        if (client.ip && client.ip === _ip) {
          return client
        }
      }
    }
  } catch(err) {
    msg(0,f,msgE.error,"Reading client file ", clientId, ' - ', err);
  }
}

const loadEdgeConfig = (_payload) => {
  const f = 'administrator::loadEdgeConfig'
  msg(2,f,msgE.debug, 'enter - ', _payload.clientId || _payload.ip)
  try {
    if (!_payload.clientId && !_payload.ip) {
      msg(0,f,msgE.error,"neither the clientId or ip is defined");
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
    msg(1,f,msgE.debug, 'clientId: ',client.clientId)
    if (!client) {
      msg(0, f, msgE.warning, "Client not found", id);
      return;
    }
    loadClientMetrics(client)  // loads metrics from all projects
    return client
  } catch (err) {
    msg(0,f,msgE.error,  clientId, ' - ', err);
  }

}

const loadMqttConfig = (_payload) => {
  const f = "administrator::loadMqttConfig"
  msg(0,f,msgE.error, 'enter - ', _payload.clientId)
  try {
    var client = loadClient("clients", _payload.clientId, "NONE")
    for (var clientId in client.clients) {
      if (clientId !== "all") {
        if (client.clients[clientId] !== "enabled") {
          delete client.clients[clientId]
          continue;
        }
        client.clients[clientId] = loadClient('clients', clientId, "NONE")
        var nc = client.clients[clientId]
        if (!nc) {
          msg(1,f,msgE.error, `Client not found ${clientId}`)
          continue;
        }
        delete nc.topics
        delete nc.topicSets
        delete nc.statusDefault
        delete nc.mqtt
        delete nc.clients
        delete nc.actionIds
        delete nc.page
      }
    }
    return client;
  } catch(err) {
    msg(0,f,msgE.error, 'Error loading MQTT config',err)
  }
}

const loadYmlFile = (_client, _panel) => {
  const f = "administrator::loadYmlFile - "
  var path
  try {
    path = `${process.env.ROOT_PATH}/${adminId}/projects/${_client.projectId}/panels/${_panel}.yml`
    var ymlStr = fs.readFileSync(path)
    return YAML.safeLoad(ymlStr)
  } catch(err) {
    msg(0,f,msgE.error,`Error loading ${path} - `, err);
  }
}
const loadHmiPanels = (_client) => {
  if (_client?.page?.panels) {
    for (var panel in _client.page.panels) {
      _client.page.panels[panel] = loadYmlFile(_client, panel)
    }
  }
}

const loadHmiConfig = (_payload) => {
  const f = 'administrator::loadHmiConfig - '
  msg(1,f,msgE.debug, 'enter - ', _payload.clientId)
  try {
    var client = loadClient("clients", _payload.clientId, _payload.projectId)
    // load multiple projects if configured as an array
    // add projectId
    if (Array.isArray(_payload.projectId))
    client.metrics = {}

    client.metrics = {
      [_payload.projectId]: getProjectMetrics(client.projectId, client)
    }
    loadHmiPanels(client)
    return client;
  } catch(err) {
    msg(0,f,msgE.error, 'Error loading config',err)
  }
}

loadAdministratorConfig();
//loadProjectMetrics()

console.log(fm, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(connectCB, processCB);
console.log(fm, 'Exit main thread')