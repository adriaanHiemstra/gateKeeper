// app/components/icons/UsersIcon.tsx
import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { SvgProps } from "react-native-svg";

const UsersIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M16 11C18.2091 11 20 9.20914 20 7C20 4.79086 18.2091 3 16 3C13.7909 3 12 4.79086 12 7C12 9.20914 13.7909 11 16 11Z
         M8 11C10.2091 11 12 9.20914 12 7C12 4.79086 10.2091 3 8 3C5.79086 3 4 4.79086 4 7C4 9.20914 5.79086 11 8 11Z
         M8 13C5.33 13 0 14.34 0 17V20H16V17C16 14.34 10.67 13 8 13Z
         M16 13C15.77 13 15.52 13.01 15.26 13.03C16.32 13.84 17 14.88 17 16V20H24V17C24 14.34 18.67 13 16 13Z"
      fill={props.fill || "#000"}
    />
  </Svg>
);

export default UsersIcon;

