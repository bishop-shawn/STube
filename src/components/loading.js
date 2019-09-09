// @flow
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Icon from './icon';
import { fitSize } from '../util/baseUtil';
import { STYLE_CONSTANT } from '../constant';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    fontSize: fitSize(12),
    color: 'gray',
    textAlign: 'center',
  },
  image: {
    width: fitSize(40),
    height: fitSize(20),
  },
});

type Props = {
  containerStyle: Object,
  title: string,
  icon: Object,
  iconStyle: Object,
  titleStyle: Object,
  activityIndicator?: Boolean,
};

const Loading = (props: Props) => {
  const { containerStyle, title, iconStyle, icon, titleStyle, activityIndicator } = props;
  const mergeIconStyle = Object.assign(
    {
      color: STYLE_CONSTANT.themeColor,
    },
    iconStyle,
  );
  const loadingIcon = icon ? <Icon {...icon} style={mergeIconStyle} /> : <ActivityIndicator {...mergeIconStyle} />;
  return (
    <View style={[styles.container, containerStyle]}>
      {activityIndicator ? loadingIcon : <Image style={styles.image} source={require('../resource/loading.gif')} />}
      {title && <Text style={[styles.loading, titleStyle]}>{title}</Text>}
    </View>
  );
};

Loading.defaultProps = {
  activityIndicator: false,
};

export default Loading;
