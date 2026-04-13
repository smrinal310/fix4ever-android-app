declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: ViewStyle | TextStyle;
  }

  export default class Icon extends Component<IconProps> {}
}
