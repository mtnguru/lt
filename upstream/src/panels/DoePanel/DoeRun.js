import React, {useState} from 'react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import DoeElement from './DoeElement'
import DoeForm from './DoeForm'
import {findMetric, getValue} from '../../utils/metrics'
import ('./DoeRun.scss')

const DoeRun = (props) => {
  const [showModal, setShowModal] = useState(false)
  const [payload, setPayload] = useState({
    date: 'none',
    time: 0,
    metrics: {
      static: {},
      variables: {},
    }
  })

//const showModalH = () => {
//  setShowModal(true)
//}

  const onCloseForm = () => {
    setShowModal(false)
  }

  const onMark = (event) => {
    const f = "DoeRun::onMark"
    console.log(f,'enter')
    const time = Date.now();
    const date = new Date(time);
    const datestr =
      date.getFullYear() + '-' +
      ('0' + (date.getMonth()+1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2) + ' ' +
      date.getHours()+ ':'+
      ('0' + date.getMinutes()).slice(-2)+ ':' +
      ('0' + date.getSeconds()).slice(-2)+ ' - ' +
      ('00' + date.getMilliseconds()).slice(-3)

    // Create a list of static metricId: value
    // must use staticm - static is a reserved word
    const staticm = {}
    for (let metricId in global.aaa.doe.static) {
      const metric = findMetric(metricId)
      if (!metric) return;
      staticm[metricId] = getValue(metric)
    }

    // Create a list of variables metricId: value
    const variables = {}
    for (let metricId in props.run.variables) {
      const metric = findMetric(metricId)
      if (!metric) return;
      variables[metricId] = getValue(metric)
    }

    let payload = {
      experiment: '42',
      time: Date.now(),
      date: datestr,
      runId: props.run.id + 1,
      notes: 'Notes typed in above will be inserted here.',
      metrics: {
        static: staticm,
        variables: variables
      }
    }
    setPayload(payload);

    setShowModal(true)
    console.log('payload ',payload)
  }

  return (
    <tr className="doe-run" key={props.run.id}>
      {showModal && <Modal><DoeForm closeH={onCloseForm}payload={payload}/></Modal> }
      <td>
        {props.run.id + 1}
        <Button type="push" className="mark" label="Mark" onClick={onMark} />
      </td>
      {Object.keys(props.run.variables).map(metricId => {
        return <DoeElement
          key={metricId}
          element={props.run.variables[metricId]}
          metricId={metricId}
        />
      })}
    </tr>
  )
}
/*
{Object.keys(props.run.variables).map(variable => {
  return <td key={`${props.run.id}-${variable}`}>{props.run.variables[variable]}</td>
})}
 */

export default DoeRun
