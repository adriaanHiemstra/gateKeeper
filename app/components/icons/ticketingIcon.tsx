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
      stroke="#fff"
      strokeMiterlimit={10}
      strokeWidth={4}
      d="M24.37 9.634a3.127 3.127 0 0 1-.163-4.247.26.26 0 0 0-.014-.352l-2.956-2.959a.26.26 0 0 0-.368 0l-4.71 4.71a1.58 1.58 0 0 0-.382.62 1.586 1.586 0 0 1-1.002 1.004 1.587 1.587 0 0 0-.619.382L2.076 20.87a.26.26 0 0 0 0 .369l2.955 2.955a.26.26 0 0 0 .353.014 3.127 3.127 0 0 1 4.409 4.41.259.259 0 0 0 .014.352l2.955 2.955a.26.26 0 0 0 .369 0l12.08-12.08c.174-.174.305-.386.383-.62a1.583 1.583 0 0 1 1-1.004c.234-.078.446-.208.62-.382l4.71-4.71a.26.26 0 0 0 0-.369l-2.955-2.955a.259.259 0 0 0-.353-.015 3.127 3.127 0 0 1-4.247-.155Z"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={4}
      d="m16.632 9.262-1.106-1.106m4.053 4.053-.737-.736m3.685 3.685-.736-.737m4.053 4.053-1.106-1.106"
    />
  </Svg>
)
export default SvgComponent
