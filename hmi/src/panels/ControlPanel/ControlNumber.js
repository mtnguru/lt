// File: ControlNumber.js
// import React, {useState} from 'react';

import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'

const ControlNumber = (props) => {
  return (
    <NumberInput className="control-number" size="sm" defaultValue={15} min={0} max={100} step={5} precision={0}>
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  )
}

export default ControlNumber