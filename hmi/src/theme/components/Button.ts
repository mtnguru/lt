// 1. We can update the base styles
const baseStyle = {
  fontWeight: 'bold', // Normally, it is "semibold"
}

// 2. We can add a new button size or extend existing
const sizes = {
  xl: {
    h: '56px',
    fontSize: 'lg',
    px: '32px',
  },
}

// 3. We can add a new visual variant
const variants = {
  'with-shadow': {
    bg: 'red.400',
    boxShadow: '0 0 2px 2px #efdfde',
  },
  'client': {
    bg: "orange",
    p: "0",
    h: "auto",
    w: "auto",
    minW: "auto",
    minH: "auto",
  }
}

// 6. We can overwrite defaultProps
const defaultProps = {
  size: 'lg', // default is md
  variant: 'sm', // default is solid
  colorScheme: 'green', // default is gray
}


export const button = { variants, defaultProps, sizes, baseStyle }