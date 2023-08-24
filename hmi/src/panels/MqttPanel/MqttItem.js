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
  const [short, setShort] = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState('')

  // Format the payload - Raw, JSON, Pretty
  useEffect(() => {
    var payloadStr = props.item.payload         // Display the Raw payload

    var short = ''
//  var author = ''
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
              short = `???: ${payload["function"]} - ${payload.content}`
            } else if (props.item.func === 'out') {
              short = `out: ${payload.value} - ${payload.metric}`
            } else if (props.item.func === 'inp') {
              short = `${payload.value} - ${payload.metric}`
            } else if (props.item.func === 'cmd') {
              switch (payload.cmd) {
                case 'setEnabled':
                  short = `${payload.cmd} - ${payload.enabled}`
                  break
                case 'setDebugLevel':
                  short = `${payload.cmd} - ${payload.debugLevel}`
                  break
                case 'setSampleInterval':
                  short = `${payload.cmd} - ${payload.sampleInterval}`
                  break
                case 'requestConfig':
                  short = `${payload.cmd} - ${payload.clientId}`
                  break
                default:
                  short = `${payload.cmd}`
                  break
              }
            } else if (props.item.func === 'rsp') {
              switch (payload.rsp) {
                case 'setEnabled':
                  short = `${payload.rsp} - ${payload.enabled}`
                  break
                case 'setDebugLevel':
                  short = `${payload.rsp} - ${payload.debugLevel}`
                  break
                case 'setSampleInterval':
                  short = `${payload.rsp} - ${payload.sampleInterval}`
                  break
                default:
                  payloadStr = makeJsonPretty(payloadStr)
                  break
              }
            } else if (props.item.func === 'cod') {
              short = `${payload["function"]}\n${payload.msg}` ;
              setType(payload.type)
            } else if (props.item.func === 'msg') {
              if (payload.author) {
                setAuthor(payload.author)
              }
              payloadStr = payload.msg
              setType(payload.type)
            } else {
              payloadStr = makeJsonPretty(payloadStr)
            }
          }
        } else if (props.pretty === "pretty") { // Non JSON pretty - inputs, outputs and human

          if (props.item.func === 'inp' ||
              props.item.func === 'hum' ||
              props.item.func === 'out') {
            var {tags, values} = extractFromTags(props.item.payload)
            var val = `${values["value"]}`
            var len = val.length;
            for (var i = 0; i < 7-len; i++) val += ' '
            short = `${val} ${tags["MetricId"]}`
          }
        }
      }
    }
    if (short) {
      setShort(short);
      setPayloadOut('')
    } else {
      setShort('')
      setPayloadOut(payloadStr)
    }
  }, [props.item.action, props.item.func, props.item.payload, props.pretty])

  return (
    <div className='mqtt-item'>
      <Card funcId={props.item.func} className={props.pretty}>
        <div className='right'>
          <span className='nitems'>{props.item.nitems.toString()}</span>
          <span className='date'>{props.item.date}</span>
          <span className='topic'>{props.item.topic}</span>
        </div>
        <div className={`left mqtt-clientId-bg`}>
          <span className={`clientId ${props.item.clientId}`}>{props.item.clientId}</span>
          {type   && <span className={`type ${type}`}>{type}</span>}
          {author && <span className='author'>{author}</span>}
          {short  && <span className='short'><pre>{short}</pre></span>}
        </div>
        <pre className='payload'>
          {payloadOut}
        </pre>
      </Card>
    </div>
  )
}

export default MqttItem