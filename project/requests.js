var mqtt_lt = require('./utils/mqtt_lt');
var {msg, setDebugLevel} = require('./utils/msg');
require('dotenv').config();


/*
 * Processes a request for a devices configuration - device, inp, out.
 */
const getHmiConfig = (ip) => {
  const f = 'requests:getHmiConfig - '
  console.log(f,'enter - ',ip);
  return global.config.hmi;
}

/*
 * Processes a request for a devices configuration - device, inp, out.
 */
const getDeviceConfig = (ip) => {
  const f = 'requests:getDeviceConfig - '
  console.log(f,'enter - ',ip);
  let name;

  // Find the device
  let device;
  let client;
  for (name in global.config.devices) {

    let d = global.config.devices[name]
    if (d.ip == ip) {
      console.log(f,'ip found: ',ip);
      device = d;
      client = name;
    }
  }
  if (!device) {
    msg(1,f, DEBUG `IP address for device not found: ${ip}`)
  }

  // Find the inp
  let inp = {};
  for (name in global.config.inp) {
    let input = global.config.inp[name]
    if (input.client == client) {
      inp[name] = input;
      console.log(f,'  add input: ', name)
    }
  }

  // Find the out
  let out = {};
  for (name in global.config.out) {
    let output = global.config.out[name]
    console.log(f,'  ----------- check output --------- ', name, '  ', client, '  ', output.client)
    if (output.client == client) {
      out[name] = output
      console.log(f,'  add output: ', name)
    }
  }

  let config = {client, device, inp, out};
  console.log(f,'exit');
  return config;
}

/*
 * processCB - called by mqtt library when a message has arrived.
 */
const processCB = (topic, payloadRaw) => {
  const f = 'requests.processCB'
  let config;
  let topic2;
//console.log(f,'enter');
  try {
    payloadStr = payloadRaw.toString();
    if (topic.indexOf('edge/config/request') > -1) {
      console.log(f,'   config: ', topic, payloadStr)
      let payload = JSON.parse(payloadStr)
      console.log(f,'   payload: ', topic, payload)
      switch (payload.type) {
        case 'config':
        case 'deviceConfig':
          config = getDeviceConfig(payload.ip);
          topic2 = `edge/config/send/${payload.ip}`
          break;
        case 'hmiConfig':
          config = getHmiConfig(payload.ip);
          topic2 = `edge/config/send/${payload.ip}`
          break;
      }

      let payloadStr2 = JSON.stringify(config);
      console.log(f,'   send: ', payloadStr2.length, topic2, payloadStr2)
      mqtt_lt.send(topic2, payloadStr2);
    } else if (topic.indexOf('edge/input' > -1)) {
      console.log(f,'   input: ', topic, payloadStr)
    } else {
      msg(0,f,WARNING,'Topic not found:',topic)
    }
  } catch (err) {
    msg(0,f,ERROR,'catch -',err)
  }
  return null;
}

module.exports.processCB = processCB;
