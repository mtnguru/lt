// File: administrator.js


const fs = require('fs')
const YAML = require('yaml-parser')
const path = require('path')
require('dotenv').config();

const mqttNode  = require('./utils/mqttNode')
const {ckTopic, completeAllTopics, completeTopic}  = require('./utils/topics')
const {msg, setDebugLevel} = require("./utils/msg")
const influx = require("./utils/influx")
const {currentDate} = require("./utils/tools")
const os = require('os')

const seedrandom  = require('seedrandom')
const clientId = "administrator"
const generator = seedrandom(Date.now())

var sourceIds;

const fm = "administrator:main - "

var V = {}
const SourceIds = ['inp', 'hum', 'out', 'upper', 'lower', 'high', 'low']

var adminId = "none"
if (process.argv[2]) {
  adminId = process.argv[2]
} else {
  console.log('ERROR: No adminId specified')
  process.exit(1);
}

const mqttClientId = `${clientId}_${adminId}_${generator().toString(16).slice(10)}`

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
    clientId: global.aaa.clientId,
    adminId: adminId,
    mqttClientId: mqttClientId,
    mqttConnected: global.aaa.status.mqttConnected,
    mqttSubscribe: global.aaa.status.mqttSubscribe,
    mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
    hostname: os.hostname(),
    debugLevel: global.aaa.status.debugLevel,
    uptime: uptime,

    clientId: global.aaa.clientId,
    userId: global.aaa.userId,
    mqttClientId: global.aaa.mqttClientId,
    mqttConnected: global.aaa.status.mqttConnected,
    mqttSubscribe: global.aaa.status.mqttSubscribe,
    mqttUnsubscribe: global.aaa.status.mqttUnsubscribe,
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
 * addMetricValues -- Add Metric values to client config
 *
 * @param projectId
 * @param metricId
 * @param sourceId
 * @param values
 * @param userId
 */
const addMetricValues = (projectId, metricId, sourceId, values, userId) => {
  const f = "administrator::addMetricValues"
  try {
    // Add object to V tree if necessary
    if (!V?.[projectId]?.[metricId]?.[sourceId]) {
      if (!(projectId in V)) {
        V[projectId] = {[metricId]: {[sourceId]: {}}}
      } else if (!(metricId in V[projectId])) {
        V[projectId][metricId] = {[sourceId]: {}}
      } else if (!(sourceId in V[projectId][metricId])) {
        V[projectId][metricId][sourceId] = {}
      }
    }

    // for each valueId in values array
    for (var valueId in values) {
      // Add a new v object to the tree for each valueId
      // If there is already a valueId - copy new properties - don't touch state and stale
      if (valueId in V[projectId][metricId][sourceId]) {
        V[projectId][metricId][sourceId][valueId].val = values[valueId].val
        V[projectId][metricId][sourceId][valueId].date = values[valueId].date
        V[projectId][metricId][sourceId][valueId].userId = values[valueId].userId
      } else { // if there is no valueId
        V[projectId][metricId][sourceId][valueId] = values[valueId]
        V[projectId][metricId][sourceId][valueId].state = 'unk8'
        V[projectId][metricId][sourceId][valueId].stale = 'unk8'
      }
    }
  } catch(err) {
    console.error(f, err)
  }
}

/**
 * checkMetricValues - check inp, hum, out against upper, lower, high, low
 *   Set the valueState for each, if changed then send a message
 *
 * @param _projectId
 * @param _metricId
 *
 * Check the status of a metric and publish a message if the status changes
 * Check against high and low first
 * Then check upper alarm and lower alarm
 * If current status is different then
 *   publish a message to the bus
 */
const checkMetricValues = (_projectId, _metricId) => {
  const f = 'administrator::checkMetricValues'

  try {
    var vm = V[_projectId][_metricId];
    const srcIds = ['inp', 'out', 'hum']
    for (var s in srcIds) {
      const sourceId = srcIds[s]
      if (vm[sourceId]) {
        var state = 'ok'
        const value = vm[sourceId].value.val
        var setPoint = -999;
        if (vm.high && val > vm.high.value.val) {          // high range
          setPoint = vm.high.value.v
          state = "high"
        } else if (vm.low && val < vm.low.value.val) {     // low range
          setPoint = vm.low.value.v
          state = "low"
        } else if (vm.upper && val > vm.upper.value.val) { // upper alarm
          setPoint = vm.upper.value.v
          state = "upper"
        } else if (vm.lower && val < vm.lower.value.val) { // lower alarm
          setPoint = vm.lower.value.v
          state = "lower"
        }
        if (state !== vm[sourceId].value.state) {
          const payload = {
            metricId: _metricId,
            projectId: _projectId,
            initialState: vm[sourceId].value.state,
            state: state,
            setPoint: setPoint,
            value: value,
            vm: vm,
          }
          vm[sourceId].value.state = state
          var topic = global.aaa.topics.publish.alm
          topic = topic.replace(/DPROJECTID/, _projectId)
          var str = JSON.stringify(payload)
          msg(1, f, DEBUG, `call mqttNode.publish - topic: ${topic} length:${str.length}`)
          mqttNode.publish(topic, str);
        }
      }
    }
  } catch(err) {
    msg(1, f, ERROR, err, err.lineNumber);
  }
}

//  output to MQTT all values of a metric
const publishMetricValues = (_projectId, _metricId, _clientId) => {
  // publish values
  // topic PROJECTID/rsp/clientId
  var mv;
  if (mv = V[_projectId][_metricId]) {
    var payload = {}
    if (mv.stale)  { payload['stale'] = mv.stale}
    if (mv.status) { payload['status'] = mv.status}
    if (mv.inp)    { payload['inp'] = mv.value}
    if (mv.hum)    { payload['hum'] = mv.value}
    if (mv.out)    { payload['out'] = mv.value}
    if (mv.high)   { payload['high'] = mv.high}
    if (mv.low)    { payload['low'] = mv.low}
    if (mv.upper)  { payload['upper'] = mv.upper }
    if (mv.lower)  { payload['lower'] = mv.lower }

    var outTopic = `${_projectId}/rsp/${_clientId}`
    var outStr = JSON.stringify(payload)
    msg(1,f, DEBUG,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
    mqttNode.publish(outTopic, outStr);
  } else {
    msg(0,f, WARNING,`metric not found ${_projectId} ${_metricId}`)
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
  //       sourceId - inp, out, hum, upper, lower, high, low
  //         valueId = value
  //           val
  //           datetime
  //           userId
  var [projectId,sourceId,clientId,userId,edgeId] = _topic.split('/')
  projectId = projectId.toLowerCase()
  sourceId = sourceId.toLowerCase()
  userId = userId.toLowerCase()

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
  msg(2,f, DEBUG,"payload - ", payload)
  var ivalues;
  if (flds[1] === undefined) {
    ivalues['value']
    msg(0,f, ERROR,"no flds[1] === undefined " + metricId)
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
  addMetricValues(projectId, metricId, sourceId, values, userId)
  checkMetricValues(projectId, metricId)
//var status = checkMetricStatus(projectId, metricId)

  return ['', null];
}

/**
 * getMetricV - get the V array for a process, metric, source or value
 *
 * @param projectId
 * @param metricId
 * @param sourceId
 * @param valueId
 * @returns {{}|null|*}
 */
const getMetricV = (_projectId, _metricId, _sourceId, _valueId) => {
  const f = 'administrator::getMetricV'
  var vp, vm, vs, vv;
  const projectId = (_projectId) ? _projectId.toLowerCase() : null
  const metricId  = (_metricId)  ? _metricId.toLowerCase()  : null
  const sourceId  = (_sourceId)  ? _sourceId.toLowerCase()  : null
  const valueId   = (_valueId)   ? _valueId.toLowerCase()   : null
  if (projectId) {
    if (!(vp = V[projectId])) {
      msg(1,f, ERROR,"Not found - Cannot find projectId - ", projectId)
      return null;
    }
    if (metricId) {
      if (!(vm = V[projectId][metricId])) {
        msg(1,f, ERROR,"Not found - Cannot find metricId - ", projectId + ' ' + metricId)
        return null;
      }
      if (sourceId) {
        if (!(vs = V[projectId][metricId][sourceId])) {
          msg(1,f, ERROR,"Not found - Cannot find sourceId - ", projectId+ ' ' + metricId + ' ' + sourceId)
          return null;
        }
        if (valueId) {
          if (!(vv = V[projectId][metricId][sourceId][valueId])) {
            msg(1,f, ERROR,"Not found - Cannot find valueId- ", projectId+ ' ' + metricId + ' ' + sourceId + ' ' + valueId)
            return null;
          }
          vs.type = 'value'
          return vv
        } else {
          vs.type = 'source'
          return vs
        }
      } else {
        vm.type = 'metric'
        return vm
      }
    } else {
      vp.type = 'project'
      return vp
    }
  } else {
    V.type = 'V'
    return V
  }
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
        out.v = getMetricV(_payload.projectId, _payload.metricId, _payload.sourceId, _payload.valueId)
      } else if (_payload.cmd === 'requestJsonFile') {
        msg(2, f, DEBUG, "Read json file: ", filepath)
        const filepath = `${process.env.ROOT_PATH}/${_payload.filepath}`
        const data = fs.readFileSync(filepath);
        out = JSON.parse(data)
      } else if (_payload.cmd === 'requestYmlFile') {
        const filepath = `${process.env.ROOT_PATH}/${_payload.filepath}`
        msg(2, f, DEBUG, "Read yml file: ", filepath)
        out = YAML.safeLoad(fs.readFileSync(filepath));
      }
    }
  } catch(err) {
    msg(0,f,ERROR, 'Error processing Cmd -- ',err)
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
  msg(1,f,DEBUG, 'enter');
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
        if (clientId != "all") {
          global.aas.clients[clientId].debugLevel = input.debugLevel
        }
      } else if (input.rsp === 'setEnabled') {
        if (clientId != "all") {
          global.aas.clients[clientId].enabled = input.enabled
        }
      }
    // If this is inp, out, hum influx data then update values in the V array
    } else if (SourceIds.includes(sourceId)) {
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
            for (var s in SourceIds) {
              const sourceId = SourceIds[s]
              if (fMetric[sourceId]) {
                metric[sourceId] = fMetric[sourceId]
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
          // Go through all SourceIds and update the V array with default values
          for (var s in SourceIds) {
            const sourceId = SourceIds[s]
            var values = {}
            if (metric[sourceId]) {
              if (V?.[_projectId]?.[metricId]?.[sourceId]?.['value']) {
                // do nothing?
              } else if (metric[sourceId].default) {
                values = {
                  value: {
                    val: metric[sourceId].default,
                    date: Date.now(),
                    userId: userId,
                    state: 'unk1',
                    stale: 'unk1',
                  },
                }
                addMetricValues(_projectId, metricId, sourceId, values, userId)
                checkMetricValues(_projectId, metricId)
              }
            }
          }
        }
      }
    });
  } catch(err) {
    msg(0,f, ERROR, err)
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

    // for each metricId/sourceId - maketags and topics
    for (var metricId in metrics) {
      var metric = metrics[metricId]
      for (sourceId of SourceIds) {
        if (metric[sourceId]) {
          metric[sourceId].tags = influx.makeTagsFromMetricId(metric.name, sourceId, _projectId)
          metric[sourceId].topic = completeTopic(_client.topics.publish[sourceId], args)
          setDefaults(metric)
        }
      }
    }
  } catch(err) {
    msg(0,f, ERROR, err)
  }
  return metrics;
}

const loadClientMetrics = (_client) => {
  const f = 'administrator::loadClientMetrics'
  // for each projectId
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
          metric.metricId = orgMetricId.toLowerCase();  // Change key to lower case
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
          for (sourceId of SourceIds) {
            if (_client.topics.publish[sourceId] && metric[sourceId]) {
              if (metric[sourceId] && metric[sourceId].clientId === _client.clientId) {
                metric[sourceId].tags = influx.makeTagsFromMetricId(metric.name, "inp", projectId)
                metric[sourceId].topic = completeTopic(_client.topics.publish[sourceId], args)
                if (!_client[sourceId]) _client[sourceId] = {}
                _client[sourceId][metricId] = metric
              }
            }
          }
        }
      }
    });
  }
}

/**
 * setDefaults
 * @param metric
 *
 * Set the defaults for inp, hum, out, upper, lower, high, low
 *   if possible get the V[projectId, metridId record set to v
 */
const setDefaults = (_metric) => {
  const f = "administrator::setDefaults"
  const projectId = _metric.projectId
  const metricId = _metric.metricId
  // Get V for this metric first - there is only one
  try {
    var vm = getMetricV(projectId, metricId)
    vm = (vm && vm.type === "metric") ? vm : undefined
    if (!_metric.v) _metric.v = {}

    for (var sourceId in sourceIds) {
      if (!_metric[sourceId]) continue    // skip unconfigured sources
      var v
      var vms
      if (vm && vm[sourceId]) {                 // if there is a current value
        _metric.v[sourceId] = vm[sourceId]
      } else if ('default' in _metric[sourceId]) {  // if there is a default valu
        vms = {
          value: {
            val: _metric[sourceId].default,
            date: Date.now(),
            userId: 'unk2',  // should be default
            state: 'unk2',
            stale: 'unk2',
          }
        }
        _metric.v[sourceId] = vms
        addMetricValues(projectId,metricId,sourceId,vms, 'default')
      } else {          // no V && no default
        vms = {
          value: {
            val: -999999,
            date: Date.now(),
            userId: 'unk3',
            state: 'unk3',
            stale: 'unk3',
          }
        }
        _metric.v[sourceId] = vms
        addMetricValues(projectId,metricId,sourceId,vms, 'unspecified')
      }
    }
  } catch(err) {
    msg(0,f,ERROR,err);
  }
}

const readSourceIds = () => {
  const f = "administrator::readSourceIds"
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
  const f = "administrator::initClients"
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

const loadProjectFile = (projectId) => {
  const f = "administrator::loadProject - "
  try {
    var ymlStr = fs.readFileSync(`${process.env.ROOT_PATH}/${adminId}/projects/${projectId}/project.yml`)
    var yml = YAML.safeLoad(ymlStr)
    yml.projectId = projectId
    return yml
  } catch(err) {
    msg(0,f,ERROR,"Error loading project.yml file: ", projectId, ' - ', err);
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
  sourceIds = readSourceIds()
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

    if (client.sourceIds) {
      client.sourceIds = sourceIds
    }
  } catch(err) {
    msg(0,f,ERROR,"Error loading client ", _clientId, ' - ', err);
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
          return client;
        }
      }
    }
  } catch(err) {
    msg(0,f,ERROR,"Reading client file ", clientId, ' - ', err);
  }
}

const loadEdgeConfig = (_payload) => {
  const f = 'administrator::loadEdgeConfig'
  msg(0,f,DEBUG, 'enter - ', _payload.clientId || _payload.ip)

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
    msg(0, f, WARNING, "Client not found", id);
    return;
  }

  loadClientMetrics(client)
//setDefaults(client.metrics)
  return client
}

const loadMqttConfig = (_payload) => {
  const f = "administrator::loadMqttConfig"
  msg(0,f,DEBUG, 'enter - ', _payload.clientId)
  try {
    var client = loadClient("clients", _payload.clientId, _payload.projectId)
    for (var clientId in client.clients) {
      if (clientId !== "all") {
        if (client.clients[clientId] !== "enabled") {
          delete client.clients[clientId]
          continue;
        }
        client.clients[clientId] = loadClient('clients', clientId, "UNK")
        var nc = client.clients[clientId]
        if (!nc) {
          msg(1,f,ERROR, `Client not found ${clientId}`)
          continue;
        }
        delete nc.topics
        delete nc.topicSets
        delete nc.statusDefault
        delete nc.mqtt
        delete nc.clients
        delete nc.sourceIds
        delete nc.page
      }
    }
    return client;
  } catch(err) {
    msg(0,f,ERROR, 'Error loading MQTT config',err)
  }
}

const loadHmiConfig = (_payload) => {
  const f = 'administrator::loadHmiConfig - '
  msg(0,f,DEBUG, 'enter - ', _payload.clientId)
  try {
    var client = loadClient("clients", _payload.clientId, _payload.projectId)
    client.metrics = getProjectMetrics(_payload.projectId, client)
    return client;
  } catch(err) {
    msg(0,f,ERROR, 'Error loading config',err)
  }
}

loadAdministratorConfig();
//loadProjectMetrics()

console.log(fm, 'Connect to mqtt server and initiate process callback')
mqttNode.connect(connectCB, processCB);
console.log(fm, 'Exit main thread')