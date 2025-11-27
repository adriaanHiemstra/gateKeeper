// app/styles/typography.ts
import { StyleSheet } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

export const textStyles = StyleSheet.create({
  header1: {
    fontFamily: 'Jost-Medium',
    fontSize: RFValue(64),
    fontWeight: '500',
 
  },
  header2: {
    fontFamily: 'Jost-Medium',
    fontSize: RFValue(30),
    fontWeight: '500',
   
  },
  paragraph1: {
    fontFamily: 'Jost-Medium',
    fontSize: RFValue(24),
    fontWeight: '500',
   
  },
  paragraph2: {
    fontFamily: 'Jost-Medium',
    fontSize: RFValue(20),
    fontWeight: '500',

  },
  paragraph3: {
    fontFamily: 'Jost-Medium',
    fontSize: RFValue(14),
    fontWeight: '500',

  },
});
