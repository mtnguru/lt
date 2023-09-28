import React from 'react'
//import './SelectPretty.scss'

function SelectPretty (props) {

  return (
    <div className={`select-pretty`}>
      <select id={props.id} title={props.title} name={props.id} onChange={props.onChangeH} >
        <option value="pretty">Pretty</option>
        <option value="raw">Raw</option>
        <option value="json">JSON/InfluxDB</option>
      </select>
    </div>
  )
}
export default SelectPretty;
