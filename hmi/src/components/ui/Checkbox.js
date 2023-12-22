import React from 'react'
//import './Checkbox.scss'
import { Box } from '@chakra-ui/react'
import {useEffect, useState} from "react";
//import {mqttRegisterMetricCB} from "../../utils/mqttReact";

function Checkbox (props) {
  const [selected, setSelected] = useState(1);
  useEffect(() => {
    setSelected(props.type.selected)
  }, [props.type.selected])

  return (
    <Box className={`checkbox ${props.type.typeId}`} key={`${props.type.typeId}`}>
      <input id={props.type.typeId} type='checkbox' name={props.type.typeId} onChange={props.onChangeH} checked={selected ? "checked" : ""} />
      <label htmlFor={props.type.typeId}>{props.type.name}</label>
    </Box> )
}
export default Checkbox;