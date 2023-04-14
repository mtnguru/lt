import React from 'react'
import './SelectDebugLevel.scss'

function SelectDebugLevel (props) {
  return (
    <div className={`select-debug-level ${props.id}`} key={`${props.id}`}>
      <select id={props.id} type='checkbox' title={props.title} name={props.id} onChange={props.onChangeH} >
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </div>
  )
}
export default SelectDebugLevel;

