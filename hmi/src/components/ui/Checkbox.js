import React from 'react'
import './Checkbox.scss'
import { Container } from '@chakra-ui/react'


function Checkbox (props) {

  return (
    <Container className={`checkbox ${props.type.typeId}`} key={`${props.type.typeId}`}>
      <input id={props.type.typeId} type='checkbox' name={props.type.typeId} onChange={props.onChangeH} checked={props.type.selected ? "checked" : ""} />
      <label htmlFor={props.type.typeId}>{props.type.name}</label>
    </Container> )
}
export default Checkbox;