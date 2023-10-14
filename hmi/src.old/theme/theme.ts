// theme.js

// 1. import `extendTheme` function
import { extendTheme } from '@chakra-ui/react'
import { slider }      from './components/Slider.ts'
import { text }        from './components/Text.ts'
import { button }      from './components/Button.ts'
import { select }      from './components/Select.ts'

// 2. extend the theme
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    fg: "#f0f0ff",
    fg1: "#bbffbb",
    fg2: "#ffbb55",
    rFg: "#111",
    topicFg: "#fc2",
    dateFg: "#ff4",
    titleFg: "#df8",
    title1Fg: "#afd",
    metricBg: "#2a2a4a",
    metricShadow: "#42a",
    linkFg: "#7bf",

    bg:  "#101010",
    bg1: "#131014",
    bg2: "#202020",
    bg3: "#302040",
  },
  components: {
    Text: text,
    Button: button,
    Slider: slider,
    Select: select,
  }, // components
}) // extendTheme

export default theme
