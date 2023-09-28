// theme.js

// 1. import `extendTheme` function
import { extendTheme } from '@chakra-ui/react'
import { sliderTheme } from './components/slider.ts'

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
    metricBg: "#215",
    metricShadow: "#42a",
    linkFg: "#7bf",

    bg:  "#101010",
    bg1: "#131014",
    bg2: "#202020",
    bg3: "#303030",
  },
  components: {
    Slider: sliderTheme,
    Text: {
      variants: {
        'metric': {
          bg: "metricBg",
          boxShadow: "0 0 2px 2px #42a",
          borderRadius: "4px",
          width: "4em",
          pw: 10,
          textAlign: "right",
          display: "inline-block",
          marginBottom: 1,
        },
      },
    },
    Button: {
      // 1. We can update the base styles
      baseStyle: {
        fontWeight: 'bold', // Normally, it is "semibold"
      },
      // 2. We can add a new button size or extend existing
      sizes: {
        xl: {
          h: '56px',
          fontSize: 'lg',
          px: '32px',
        },
      },
      // 3. We can add a new visual variant
      variants: {
        'with-shadow': {
          bg: 'red.400',
          boxShadow: '0 0 2px 2px #efdfde',
        },
        // 4. We can override existing variants
//      solid: (StyleFunctionProps) => ({
//        bg: props.colorMode === 'dark' ? 'red.300' : 'red.500',
//      }),
        // 5. We can add responsive variants
        sm: {
          bg: 'teal.500',
          fontSize: 'md',
        },
      },
      // 6. We can overwrite defaultProps
      defaultProps: {
        size: 'lg', // default is md
        variant: 'sm', // default is solid
        colorScheme: 'green', // default is gray
      },
    },  // Button
  }, // components
}) // extendTheme

export default theme