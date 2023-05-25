import React, {useState, useEffect} from 'react';
import Card from '../../components/ui/Card'
import {extractFromTags} from '../../utils/influxr'
import ('./MqttItem.scss')

const MqttItem = (props) => {
  const f = 'MqttItem';
  const [payloadOut, setPayloadOut] = useState('')

  // Format the payload - Raw, JSON, Pretty
  useEffect(() => {
    let payloadStr = props.item.payload         // Display the Raw payload

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
          console.log("dude: " + props.item.payload)
          try {
            payload = JSON.parse(props.item.payload);
            payloadStr = JSON.stringify(payload, null, 3)
          } catch(err) {
            console.log(f, 'ERROR parsing JSON payload: ' + err)
          }
          if (props.pretty === "pretty") {
            if (payload.content) {
              payloadStr = `${payload.function} - ${payload.content}`
            } else if (props.item.func === 'out') {
              payloadStr = `${payload.metric} - ${payload.value}`
            } else if (props.item.func === 'inp') {
              payloadStr = `shit ${payload.metric} - ${payload.value}`
            } else {
              payloadStr = payloadStr
                .replace(/"|/g, '')         // remove all double quotes
                .replace(/^{\n/, '')        // remove opening {
                .replace(/}$/, '')          // remove closing }
                .replace(/,\n/g, '\n')      // remove all trailing commas
                .replace(/\n\s*[\]}]\n/g, '\n') // remove all } on a line by themselves
                .replace(/\n\s*[\]}]\n/g, '\n') // do it a second time
                .replace(/: [[{]\n/g, ':\n');  // remove all trailing
            }
          }
        } else if (props.pretty === "pretty" &&
               (props.item.func === 'inp' || props.item.func === 'hum' || props.item.func === 'out')) {
          let {tags, values} = extractFromTags(props.item.payload)
          payloadStr = `${tags["MetricId"]} -- ${values["value"]}`
        }
      }
    }
    setPayloadOut(payloadStr)
  }, [props.item.action, props.item.func, props.item.payload, props.pretty])

  return (
    <div className='mqtt-item'>
      <Card funcType={props.item.func} className={props.pretty}>
        <div className='right'>
          <span className='date'>{props.item.date}</span>
          <span className='nitems'>{props.item.nitems.toString()}</span>
        </div>
        <div className={`left mqtt-client-bg`}>
          <span className={`clientId ${props.item.clientId}`}>{props.item.clientId}</span>
          <span className='topic'>{props.item.topic}</span>
        </div>
        <pre><code className='payload'>{payloadOut}</code></pre>
      </Card>
    </div>
  )
}

export default MqttItem