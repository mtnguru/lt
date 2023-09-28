import { sliderAnatomy as parts } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)
const baseStyle = definePartsStyle({
  // define the part you're going to style
  thumb: {
    bg: 'gray.200', // change the background of the filled track to blue.600
    color: "black",
  },
  track: {
    bg: 'gray.700', // change the background of the filled track to blue.600
    height: "8px",
  },
  filledTrack: {
    bg: 'blue.400', // change the background of the filled track to blue.600
  },
})
export const sliderTheme = defineMultiStyleConfig({ baseStyle })