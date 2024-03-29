// File: project.js
require('dotenv').config();

const mqttNode = require('./utils/mqttNode')
const influx   = require('./utils/influx')
const {msg, setDebugLevel}      = require('./utils/msg')
const {findMetric} = require('./utils/metrics')
const clientId = "project"

const f = "project:main"

// So, what does the project do?
//   Acquire configuration file - get all devices
//   Get initial recipe - is that in the project file?
//      Init
//   Start an MQTT server which listens for
//      lab1/admin/+/$IP
//         Set the configuration
//
//      lab1/inp/#
//      lab1/user/#
//   Publishes out
//      lab1/output
//

global.aaa = {
  clientId: 'project',
  project: 'lab1',
  mqtt: {
    url: "mqtt://labtime.org:1883",
    username: "data",
    password: "datawp",
    connectTimeout: 5000,
    reconnectPeriod: 5000
  },
  subscribeTopics: {
    admin: "lab1/admin/+/project"
  },
  publishTopics: {
    configReq: "lab1/admin/configReq/project"
  }
}

const loadClientConfigCB = (inTopic, inPayload) => {
  const f = "index::loadClientConfigCB"
  let config = JSON.parse(inPayload.toString(0));
  msg(2,f,msgE.debug, 'enter ', inTopic)

  // Unsubscribe from all current topics

  // Create full list of inp and out by combining them from all clients
  config.inp = {}
  config.out = {}
  for (let clientId in config.clients) {
    if (clientId !== "server") {
      const client = config.clients[clientId]
      for (let inputName in client.inp) {
        const input = client.inp[inputName]
        config.inp[inputName.toLowerCase()] = input;
      }
      for (let outputName in client.out) {
        const output = client.out[outputName]
        config.out[outputName.toLowerCase()] = output;
      }
    }
  }
  mqttNode.unsubscribe(global.aaa.subscribeTopics);
  global.aaa = config;
  mqttNode.subscribe(global.aaa.subscribeTopics);

  startProject()
}

/**
 * getConfig() - Read in the configuration file for the project
 */
const getConfig = () => {
  const f = 'project::getConfig'
  mqttNode.publish(global.aaa.publishTopics.configReq, "")
  mqttNode.registerTopicCB(global.aaa.subscribeTopics.admin, loadClientConfigCB)
  msg(2,f,msgE.debug,'exit')
}


const metricInputCB = (metric, inTopic, inPayload, tags, values) => {
  const f = "project::metricInputCB"
  msg(2,f,msgE.debug, "enter ", inTopic)
}

const metricUserCB = (metric, inTopic, inPayload, inTags, inValues) => {
  const f = "project::metricUserCB"
  msg(2,f,msgE.debug, "enter ", inTopic)

  const [project, msgType, action, clientId] = inTopic.split("/")
  try {
    const {tags, values, time} = influx.extractFromTags(inPayload)

    if (msgType === "user") {
      // Create an output message
      const outTopic = mqttNode.makeTopic(OUTPUT, 'influx', {clientId: clientId})
      const outPayload = `${influx.makeTagsFromMetric(tags['Metric'], 'out', 'unknown')} value=${values['value']}`
      msg(2,f, msgE.debug, 'payload ', outPayload)
      mqttNode.publish(outTopic, outPayload)
    }
  } catch(err) {
    msgError(f,err)
  }
}

const metricAdminCB = (metric, inTopic, inPayload, tags, values) => {
  const f = "project::metricInputCB"
  msg(2,f,msgE.debug, "enter ", inTopic)
}

/**
 * startProject - all is loaded, let's get started
 */
const startProject = () => {
  const f = 'project::startProject'
  try {

    let flds = global.aaa.subscribeTopics.admin.split('/');
    flds[2] = 'reset';
    mqttNode.registerTopicCB(flds, '/', adminCB);
    flds[2] = 'status';
    mqttNode.registerTopicCB(flds, '/', adminCB);
    flds[2] = 'debugLevel';
    mqttNode.registerTopicCB(flds, '/', adminCB);

    // Subscribe to topics
    for (let metricId in global.aaa.metrics) {
      const metric = global.aaa.metrics[metricId]
      if (metric.user) {
        msg(2,f, msgE.debug, 'register user Metric', metricId)
        mqttNode.registerMetricCB(metricId, metricUserCB)
      }
      if (metric.input) {
        msg(2,f, msgE.debug, 'register input Metric', metricId)
        mqttNode.registerMetricCB(metricId, metricInputCB)
      }
//    if (metric.output) {
//      mqttNode.registerTopicCB(metric, outputCB)
//    }
    }
  } catch(err) {
    msg(2,f,msgE.error,err)
  }
  setTimeout(()=>{

  }, 10000)
}

mqttNode.connect(clientId, mqttNode.processCB);
msg(1,f, msgE.debug, ' - requestConfig ')
getConfig();
msg(1,f, msgE.debug, ' - exit main thread ')
