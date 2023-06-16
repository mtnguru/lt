import React, {useState, useEffect} from 'react';
import Card from '../../components/ui/Card'
import {extractFromTags} from '../../utils/influxr'
import {mgError} from '../../utils/mg'
import ('./MqttItem.scss')

const makeJsonPretty = (payloadStr) => {
  payloadStr = payloadStr
    .replace(/"|/g,  '')         // remove all double quotes
    .replace(/^{\n/, '')        // remove opening {
//  .replace(/^   /g, '3')
    .replace(/}$/, '')          // remove closing }
    .replace(/,\n/g, '\n')      // remove all trailing commas
    .replace(/\n\s*[\]}]\n/g, '\n') // remove all } on a line by themselves
    .replace(/\n\s*[\]}]\n/g, '\n') // do it a second time
    .replace(/: [[{]\n/g, ':\n');  // remove all trailing
  return payloadStr
}

const MqttItem = (props) => {
  const f = 'MqttItem';
  const [payloadOut, setPayloadOut] = useState('')
  const [type, setType] = useState('')

  // Format the payload - Raw, JSON, Pretty
  useEffect(() => {
    var payloadStr = props.item.payload         // Display the Raw payload

    if (props.pretty === 'raw') {
       // Already set
    } else if (props.pretty === 'topic') {
      payloadStr = ''
    } else {
      if (props.item.action === 'requestConfig') {
        payloadStr = 'Request Configuration - who am I'
      } else if (props.item.action === 'reset') {
        payloadStr = 'Request Reset'
      } else if (props.item.action === 'status') {
        payloadStr = 'Request Status Report'
      } else {
        if (props.item.payload[0] === '{') {    // if this payload is JSON
          var payload = {};
          try {
            payload = JSON.parse(props.item.payload);
            payloadStr = JSON.stringify(payload, null, 3)
          } catch(err) {
            mgError(0,f, 'ERROR parsing JSON payload: ' + err)
          }
          if (props.pretty === "pretty") {
            if (payload.content) {
              payloadStr = `???: ${payload["function"]} - ${payload.content}`
            } else if (props.item.func === 'out') {
              payloadStr = `out: ${payload.metric} - ${payload.value}`
            } else if (props.item.func === 'inp') {
              payloadStr = `inp: ${payload.metric} - ${payload.value}`
            } else if (props.item.func === 'cmd') {
              switch (payload.cmd) {
                case 'setEnabled':
                  payloadStr = `cmd: ${payload.cmd} - ${payload.enabled}`
                  break
                case 'setDebugLevel':
                  payloadStr = `cmd: ${payload.cmd} - ${payload.debugLevel}`
                  break
                case 'setSampleInterval':
                  payloadStr = `cmd: ${payload.cmd} - ${payload.sampleInterval}`
                  break
                case 'requestConfig':
                  payloadStr = `cmd: ${payload.cmd} - ${payload.clientId}`
                  break
                default:
                  payloadStr = `cmd: ${payload.cmd}`
                  break
              }
            } else if (props.item.func === 'rsp') {
              switch (payload.rsp) {
                case 'setEnabled':
                  payloadStr = `rsp: ${payload.rsp} - ${payload.enabled}`
                  break
                case 'setDebugLevel':
                  payloadStr = `rsp: ${payload.rsp} - ${payload.debugLevel}`
                  break
                case 'setSampleInterval':
                  payloadStr = `rsp: ${payload.rsp} - ${payload.sampleInterval}`
                  break
                default:
                  payloadStr = makeJsonPretty(payloadStr)
                  break
              }
            } else if (props.item.func === 'cod') {
              payloadStr = `cod: ${payload["function"]}\n${payload.msg}` ;
              setType(payload.type)
            } else if (props.item.func === 'msg') {
              payloadStr = (payload.author)
                ? `msg: ${payload.author}\n${payload.msg}`
                : `msg: ${payload["function"]}\n${payload.msg}` ;
              if (payload.author) {

              } else {

              }
              setType(payload.type)
            } else {
              payloadStr = makeJsonPretty(payloadStr)
            }
          }
        } else if (props.pretty === "pretty") {
          if (props.item.func === 'inp' || props.item.func === 'hum' || props.item.func === 'out') {
            var {tags, values} = extractFromTags(props.item.payload)
            payloadStr = `${props.item.func}: ${tags["MetricId"]} - ${values["value"]}`
          }
        }
      }
    }
    setPayloadOut(payloadStr)
  }, [props.item.action, props.item.func, props.item.payload, props.pretty])

  return (
    <div className='mqtt-item'>
      <Card funcId={props.item.func} className={props.pretty}>
        <div className='right'>
          <span className='date'>{props.item.date}</span>
          <span className='nitems'>{props.item.nitems.toString()}</span>
        </div>
        <div className={`left mqtt-clientId-bg`}>
          <span className={`clientId ${props.item.clientId}`}>{props.item.clientId}</span>
          <span className='topic'>{props.item.topic}</span>
        </div>
        <pre className='payload'>
          {type &&  <span className={type}>{type}</span>}
          {payloadOut}
        </pre>
      </Card>
    </div>
  )
}

export default MqttItem