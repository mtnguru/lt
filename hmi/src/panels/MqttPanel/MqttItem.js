import React, {useState, useEffect} from 'react';
import {extractFromTags} from '../../utils/influxr'
import {mgError} from '../../utils/mg'
import {
  Box,
  } from '@chakra-ui/react'
import ('./MqttItem.scss')
const yaml = require('js-yaml')

/*
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
 */

const MqttItem = (props) => {
  const f = 'MqttItem';
  const [payloadOut, setPayloadOut] = useState('')
  const [short, setShort] = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState('')
  const [expand, setExpand] = useState('')

  // Format the payload - Raw, JSON, Pretty
  useEffect(() => {
    var payloadStr = props.item.payload         // Display the Raw payload

    var short = ''
//  var author = ''
    if (props.pretty === 'raw') {
       // Already set
    } else {
      if (props.item.payload[0] !== '{') {    // Format is NOT JSON
        if (props.pretty === "pretty") { // Non JSON pretty - inp, out and hum
          var {tags, values} = extractFromTags(props.item.payload)
          var val = `${values["value"]}`
          var len = val.length;
          for (var i = 0; i < 7 - len; i++) {
            val += ' '
          }
          short = `${props.item.sourceId} ${val} ${tags["MetricId"]}`
        }
      } else {                               // Format is JSON
        var payload = JSON.parse(props.item.payload);
        try {
        } catch (err) {
          console.log(f, 'ERROR: parsing JSON payload: ' + props.item.topic + '  ' + err)
          mgError(0, f, 'ERROR parsing JSON payload: ' + err)
        }
        if (props.pretty === "pretty") {
          payloadStr = yaml.dump(payload,{lineWidth: -1})

          if (payload.content) {
            short = `???: ${payload["function"]} - ${payload.content}`
          } else if (props.item.sourceId === 'out' ||
            props.item.sourceId === 'inp' ||
            props.item.sourceId === 'hum' ||
            props.item.sourceId === 'upper' ||
            props.item.sourceId === 'lower' ||
            props.item.sourceId === 'high' ||
            props.item.sourceId === 'low') {
            short = `out ${payload.value} - ${payload.metric}`
          } else if (props.item.sourceId === 'cmd') {
            switch (payload.cmd) {
              case 'setEnabled':
                short = `cmd ${payload.cmd} - ${payload.enabled}`
                break
              case 'setDebugLevel':
                short = `cmd ${payload.cmd} - ${payload.debugLevel}`
                break
              case 'setSampleInterval':
                short = `cmd ${payload.cmd} - ${payload.sampleInterval}`
                break
              case 'requestConfig':
                var id = (payload.clientId) ? payload.clientId : (payload.ip) ? payload.ip : "None"
                short = `cmd ${payload.cmd} - ` + id
                break
              case 'requestStatus':
                short = `cmd ${payload.cmd} - ` + payload.clientId
                break
              default:
                short = `cmd ${payload.cmd}`
                break
            }
          } else if (props.item.sourceId === 'rsp') {
            short = `rsp ${payload.rsp} ${payload.clientId}`
            switch (payload.rsp) {
              case 'setEnabled':
                short += ` - ${payload.enabled}`
                break
              case 'setDebugLevel':
                short += ` - ${payload.debugLevel}`
                break
              case 'setSampleInterval':
                short += ` - ${payload.sampleInterval}`
                break
              default:
                break
            }
          } else if (props.item.sourceId === 'cod') {
            short = `cod ${payload["function"]} ${payload.msg}`;
            setType(payload.type)
          } else if (props.item.sourceId === 'msg') {
            short = 'msg'
            if (payload.author) {
              setAuthor(payload.author)
              short += ` ${payload.author}`
            }
            short = ` ${payload.msg}`
            setType(payload.type)
          } else {
          }
        } else {   // props.pretty != 'pretty -- display as JSON
          payloadStr = JSON.stringify(payload, null, 2)
        }
      } // if format is JSON
    } // if format is JSON
    setPayloadOut(payloadStr)
    if (short) {
      setShort(short);
    } else {
      setShort('')
    }
  }, [expand, props.item.topic, props.item.action, props.item.sourceId, props.item.payload, props.pretty])

  const onClickH = (event) => {
    setExpand((expand === 'expand') ? '' : "expand")
  }

  return (
    <div className='mqtt-item'>
      <Box className={`card ${props.pretty} ${expand} ${props.item.sourceId}`}>
        <div className='right'>
          <span className='topic'>{props.item.topic}</span>
          <span className='date'>{props.item.date}</span>
          <span className='nitems'>{props.item.nitems.toString()}</span>
        </div>
        <div className={`left mqtt-clientId-bg`}>
          <span className={`clientId ${props.item.clientId}`}>{props.item.clientId}</span>
          <button onClick={onClickH}>
            {type   && <span className={`type ${type}`}>{type}</span>}
            {author && <span className='author'>{author}</span>}
            {short  && <span className={`short`}><pre>{short}</pre></span>}
          </button>
        </div>
        <pre className='payload'>
            <button onClick={onClickH}>
              {payloadOut}
            </button>
          </pre>
      </Box>
    </div>
  )
}

export default MqttItem