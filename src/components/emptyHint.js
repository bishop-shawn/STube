// @flow
import React from 'react';
import { View, Text, Image } from 'react-native';
import { fitSize } from '../util/baseUtil';

type Props = {
  title: string,
  image: Object,
};
const EmptyHint = (props: Props) => {
  const { title, image } = props;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image resizeMode="contain" style={{ width: fitSize(75), height: fitSize(75) }} source={image} />
      <Text style={{ fontSize: fitSize(14), paddingTop: fitSize(20) }}>{title}</Text>
    </View>
  );
};

export default EmptyHint;
