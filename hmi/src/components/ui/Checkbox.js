import React from 'react'
//import './Checkbox.scss'
import { Box } from '@chakra-ui/react'


function Checkbox (props) {

  return (
    <Box className={`checkbox ${props.type.typeId}`} key={`${props.type.typeId}`}>
      <input id={props.type.typeId} type='checkbox' name={props.type.typeId} onChange={props.onChangeH} checked={props.type.selected ? "checked" : ""} />
      <label htmlFor={props.type.typeId}>{props.type.name}</label>
    </Box> )
}
export default Checkbox;
