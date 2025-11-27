import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#F5A700"
      d="m20 34.833 8.25-8.25a11.666 11.666 0 1 0-16.5 0l8.25 8.25Zm0 4.714L9.393 28.94a15 15 0 1 1 21.214 0L20 39.547Zm0-17.88A3.333 3.333 0 1 0 20 15a3.333 3.333 0 0 0 0 6.667ZM20 25a6.667 6.667 0 1 1 0-13.333A6.667 6.667 0 0 1 20 25Z"
    />
  </Svg>
)
export default SvgComponent
