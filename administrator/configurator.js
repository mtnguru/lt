const gl = require('get-current-line').default
const mqttNode = require('./utils/mqttNode');
const { msg } = require('./utils/msg');
const influx  = require('./utils/influx');
const fs = require('fs');

require('dotenv').config();

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getHmiConfig = (ip) => {
  const f = 'configurator::getHmiConfig'
  msg(2,f,DEBUG, 'enter ',ip);
  return global.config.hmi;
}

const getJsonFile = (filepath) => {

}

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getClientConfig = (id) => {
  const f = 'configurator:getClientConfig'
  msg(2,f,DEBUG,'enter',id);

  // Find the client first by clientname, then by searching the IP's of all devices.
  let clientName = '';
  let client;
  if (id in global.aaa.clients) {
    clientName = id
  } else {
    for (client in global.aaa.clients) {
      msg(3,f, DEBUG, '   check ',global.aaa.clients[client].ip)
      if (id === global.aaa.clients[client].ip) {
        msg(3,f, DEBUG, 'found client - ', id, client)
        clientName = client;
      }
    }
    if (!clientName) {
      msg(0, f, ERROR, 'Cannot find client', id)
      return null;
    }
  }

  // Read in the configuration file for the primary device
  const path = `${process.env.ROOT_PATH}/config/clients/${clientName}.json`
  msg(0,f,NOTIFY,'read: ',path);
  let json = fs.readFileSync(path)
  config = JSON.parse(json)
  config.clientName = clientName;
  config.configType = 'client'
  config.selected = 'true'
  config.project = global.aaa.project
  mqttNode.completeTopics(config)

  /*
  // The 3 loops below can be deleted soon
  // Configure the input channels
  for (let name in config.inputs) {
    let channel = config.inputs[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
  // Add properties to output channels
  for (let name in config.outputs) {
    let channel = config.outputs[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
  // Add properties to user channels
  for (let name in config.user) {
    let channel = config.user[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
  */

  msg(2,f,DEBUG, 'exit');
  return config;
}

/**
 * If the client has a clients property, then load those clients also.
 *
 * @param clients
 * @returns {{}}
 */
const getAllClientsConfig = (clients) => {
  const f = 'configurator::getAllClients'
  msg(2,f,DEBUG, 'enter');
  const config={}
  for (clientName in clients) {
    if (clientName === "all") {
      config[clientName] = clients[clientName];
    } else {
      config[clientName] = getClientConfig(clientName);
    }
  }
  return config;
}

const loadClientConfig = (clientName) => {
  const f = "configurator::loadClientConfig"
  let payloadOut = getClientConfig(clientName)
  clientName = payloadOut.clientName

// if there is a list of clients in this config - read those in too
  if (payloadOut.clients) {
    msg(1,f, DEBUG, "load all clients")
    payloadOut.clients = getAllClientsConfig(payloadOut.clients);
  }

// Add the msgTypes to the client
  if (payloadOut.msgTypes) {
    msg(1,f, DEBUG, "load msgTypes")
    const path = `${process.env.ROOT_PATH}/config/general/msgTypes.json`
    payloadOut.msgTypes = JSON.parse(fs.readFileSync(path))
  }
// Add the metrics to the client

// Build client list
  if (payloadOut.metrics) {
    msg(1,f, DEBUG, "load metrics, config/metrics/metrics.json")
    const clients = (payloadOut.clients) ? Object.keys(payloadOut.clients) : [clientName]
    const path = `${process.env.ROOT_PATH}/config/metrics/metrics.json`
    payloadOut.metrics = JSON.parse(fs.readFileSync(path))
    for (let metricName in payloadOut.metrics) {
      const metric = payloadOut.metrics[metricName]
      metric.metricName = metricName
      metric.units = metricName.split('_')[-1]

      // Only include metrics that involve clients in the clients list
      if ((metric.input && clients.includes(metric.input.clientName)) ||
          (metric.output && clients.includes(metric.output.clientName)) ||
          (metric.user && clients.includes(metric.user.clientName))) {
        if (metric.input) {
          metric.input.tags = influx.makeTagsFromMetric(metricName,"I")
        }
        if (metric.output) {
          metric.output.tags = influx.makeTagsFromMetric(metricName,"O")
        }
        if (metric.user) {
          metric.user.tags = influx.makeTagsFromMetric(metricName,"U")
        }

        // Move the metric to a metric name with all small letters
        let sMetricName = metricName.toLowerCase()
        if (sMetricName != metricName) {
          payloadOut.metrics[sMetricName] = metric
          delete payloadOut.metrics[metricName]
        }
      } else {
        delete payloadOut.metrics[metricName]
      }
    }
  }
  return payloadOut;
}

const publishStatus = () => {
  let outTopic = global.aaa.publishTopics.status;
  let elapsedSeconds = parseInt((Date.now() - global.startTime) / 1000)
  let elapsedHours = elapsedSeconds / (60 * 60)
  let payload = {
    status: 'nominal',
    uptimeHours: elapsedHours,
    uptimeSeconds: elapsedSeconds,
    debugLevel: global.debugLevel
  }

  let payloadOutStr = JSON.stringify(payload);
  mqttNode.publish(outTopic, payloadOutStr);
}

const resetServer = () => {

}

/**
 * processCB
 * @param inTopic

 const publishStatus = () => {
  let outTopic = global.aaa.publishTopics.status;
  let elapsed = parseInt((Date.now() - global.startTime) / (1000000 * 60 * 60)) / 1000
  let payload = {
    status: 'nominal',
    uptimeHours: elapsed,
    debugLevel: global.debugLevel
  }

  let payloadOutStr = JSON.stringify(payload);
  mqttNode.publish(outTopic, payloadOutStr);
}

 * @param payloadRaw
 * @returns {null}
 */
const processCB = (inTopic, payloadRaw) => {
  const f = 'configurator::processCB'
  msg(1,f,DEBUG, 'enter');
  let payloadOut;
  let outTopic;
  try {
    const [project, msgType, action, clientName, telegraf] = inTopic.split('/')

    const payloadInStr = payloadRaw.toString();
    let payloadIn = {}

    // If the payload is JSON, parse it
    if (payloadInStr && payloadInStr !== '{}') {
      msg(3,f, DEBUG,"Parse payloadInStr:", payloadInStr.toString)
      payloadIn = JSON.parse(payloadInStr)
    }
    msg(3,f,DEBUG, 'msgType', msgType, ' action', action);

    // If this is an admin message
    if (msgType === 'admin') {
      if (action === 'config' || action === 'file') {
        msg(2,f, DEBUG, "Ignore all 'config' messages: ", action, ' - ', inTopic)
        return;
      }

      if (clientName === 'admin') {
        // Set the debug level
        if (action === 'debugLevel') {
          global.debugLevel = payloadIn;
        }
        // Request to reset server client
        if (action === 'reset') {
          resetServer();
        }
        // Request for status
        if (action === 'status') {
          publishStatus();
        }
      }

      // Respond to client request for configuration
      if (action === 'configReq') {
        outTopic = mqttNode.makeTopic(ADMIN, 'config', {clientName: clientName})
        payloadOut = loadClientConfig(clientName)

      // Respond to file request
      } else if (action === 'fileReq') {
        outTopic = mqttNode.makeTopic(ADMIN,'file', {clientName: clientName})

        path = `${process.env.ROOT_PATH}/config/${payloadIn.path}`
        msg(2,f, DEBUG, "Read json file: ", path)
        json = fs.readFileSync(path)
        payloadOut = JSON.parse(json)

      // Ignore reset and status messages
      } else if ((action === "reset") ||
                 (action === 'status') ||
                 (action === 'debugLevel') ||
                 (action === 'statusReport')) {
        msg(2,f, DEBUG, "Ignore admin requests")
      } else {
        msg(0,f, ERROR,"Unknown configuration request: ", action, ' - ', inTopic)
        return;
      }

    // else read in a JSON file
    } else {
      msg(2,f, DEBUG,"call readJsonFile")
      if (!payloadIn.filename) {
        msg(0,f, ERROR,"Payload must specify a filename: ", action)
      }
      payloadOut = readJsonFile(`${flds[3]}/${payloadIn.filename}`)
      if (!payloadOut) {
        msg(0,f, ERROR,"Cannot read configuration file", action)
        return;
      }
    }

    let payloadOutStr = JSON.stringify(payloadOut);
    msg(1,f, DEBUG,"call mqttNode.publish ",outTopic, payloadOut)
    mqttNode.publish(outTopic, payloadOutStr);
  } catch (err) {
    msg(0,f, ERROR, err)
  }
  msg(2,f,DEBUG, 'exit');
  return null;
}

module.exports.processCB = processCB;
