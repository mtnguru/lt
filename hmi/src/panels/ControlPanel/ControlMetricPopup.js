// File: ControlMetricPopup.js

import {
  Portal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
//PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Button,
//Text,
//Box,
//Flex,
} from '@chakra-ui/react'

import './ControlPopup.scss'

const ControlMetricPopup = (props) => {

  return (
    <Popover className="control-metric-popup">
      <PopoverTrigger>
        <Button className="trigger">{props.trigger === "-999.00" ? '---' : props.trigger}</Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent zIndex={4}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>{props.title}</PopoverHeader>
          <PopoverBody>
            {props.content}
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}

export default ControlMetricPopup