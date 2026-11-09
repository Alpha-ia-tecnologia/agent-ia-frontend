import * as React from 'react'

// bundle.js é um script clássico que lê o React de window.React
;(window as unknown as { React: typeof React }).React = React
