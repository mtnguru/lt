// File: project.js
require('dotenv').config();

const mqttNode = require('./utils/mqttNode')
const influx   = require('./utils/influx')
const {msg, setDebugLevel}      = require('./utils/msg')
const {findMetric} = require('./utils/metrics')

const f = "project:main"

// So, what does the project do?
//   Acquire configuration file - get all devices
//   Get initial recipe - is that in the project file?
//      Init
//   Start an MQTT server which listens for
//      lab1/admin/+/$IP
//         Set the configuration
//
//      lab1/inputs/#
//      lab1/user/#
//   Publishes out
//      lab1/output
//

global.aaa = {
  clientName: 'project',
  project: 'lab1',
  mqtt: {
    url: "mqtt://labtime.org:1883",
    username: "data",
    password: "datawp",
    connectTimeout: 4000,
    reconnectPeriod: 10000
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
  msg(2,f,DEBUG, 'enter ', inTopic)

  // Unsubscribe from all current topics

  // Create full list of inputs and outputs by combining them from all clients
  config.inputs = {}
  config.outputs = {}
  for (let clientName in config.clients) {
    if (clientName !== "server") {
      const client = config.clients[clientName]
      for (let inputName in client.inputs) {
        const input = client.inputs[inputName]
        config.inputs[inputName.toLowerCase()] = input;
      }
      for (let outputName in client.outputs) {
        const output = client.outputs[outputName]
        config.outputs[outputName.toLowerCase()] = output;
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
  msg(2,f,DEBUG,'exit')
}


const metricInputCB = (metric, inTopic, inPayload, tags, values) => {
  const f = "project::metricInputCB"
  msg(2,f,DEBUG, "enter ", inTopic)
}

const metricUserCB = (metric, inTopic, inPayload, inTags, inValues) => {
  const f = "project::metricUserCB"
  msg(2,f,DEBUG, "enter ", inTopic)

  const [project, msgType, action, srcClientName] = inTopic.split("/")
  try {
    const {tags, values, time} = influx.extractFromTags(inPayload)

    if (msgType === "user") {
      // Create an output message
      const outTopic = mqttNode.makeTopic(OUTPUT, 'influx', {clientName: srcClientName})
      const outPayload = `${influx.makeTagsFromMetric(tags['Metric'], 'O')} value=${values['value']}`
      msg(2,f, DEBUG, 'payload ', outPayload)
      mqttNode.publish(outTopic, outPayload)
    }
  } catch(err) {
    msgError(f,err)
  }
}

const metricAdminCB = (metric, inTopic, inPayload, tags, values) => {
  const f = "project::metricInputCB"
  msg(2,f,DEBUG, "enter ", inTopic)
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
    for (let metricName in global.aaa.metrics) {
      const metric = global.aaa.metrics[metricName]
      if (metric.user) {
        msg(2,f, DEBUG, 'register user Metric', metricName)
        mqttNode.registerMetricCB(metricName, metricUserCB)
      }
      if (metric.input) {
        msg(2,f, DEBUG, 'register input Metric', metricName)
        mqttNode.registerMetricCB(metricName, metricInputCB)
      }
//    if (metric.output) {
//      mqttNode.registerTopicCB(metric, outputCB)
//    }
    }
  } catch(err) {
    msg(2,f,ERROR,err)
  }
  setTimeout(()=>{

  }, 10000)
}

mqttNode.connect(mqttNode.processCB);
msg(1,f, DEBUG, ' - requestConfig ')
getConfig();
msg(1,f, DEBUG, ' - exit main thread ')
