// @flow
import React, { Component } from 'react';
import { View, StyleSheet, Text, Clipboard } from 'react-native';
import { fitSize } from '../util/baseUtil';
import { STYLE_CONSTANT, DEVICE_INFO, CHANNEL, MARKET } from '../constant';
import Alert from './alert';
import Button, { ButtonType } from './button';
import DeviceInfo from '../util/deviceInfo';

const headerHeight = fitSize(52);
const innerHeight = fitSize(35);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: headerHeight,
    backgroundColor: STYLE_CONSTANT.appHeaderColor,
    zIndex: 1,
  },
  left: {
    position: 'absolute',
    left: fitSize(10),
  },
  title: {
    height: innerHeight,
    color: STYLE_CONSTANT.appHeaderTextColor,
    fontSize: fitSize(18),
    width: '70%',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  right: {
    flexDirection: 'row',
    position: 'absolute',
    right: fitSize(10),
  },
  rightButton: {
    height: innerHeight,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: fitSize(10),
  },
});

/*
  @title
  @leftComponen
  @rightButtons
  @showGoBack
  @navigation [required when showGoBack is true]
 */

type Props = {
  title?: String,
  leftComponent?: Component | Function,
  rightButtons: [
    {
      icon?: String,
      title?: String,
      onPress: Function,
    },
  ],
  showGoBack?: Boolean,
  navigation?: Object,
};

export default class AppHeader extends Component<Props> {
  static defaultProps = {
    showGoBack: true,
    title: null,
    leftComponent: null,
    navigation: null,
  };

  constructor(props: Props) {
    super(props);
    this.count = 0;
    this.countTimeout = -1;
    this.state = {
      showInfo: false,
    };
  }

  _onGoBack = () => {
    if (this.props.navigation) {
      this.props.navigation.goBack();
    }
  };

  _renderLeft() {
    const { leftComponent, showGoBack } = this.props;
    if (leftComponent instanceof Function) {
      return leftComponent();
    }
    if (leftComponent) {
      return leftComponent;
    }
    return (
      showGoBack && (
        <Button
          icon={{
            name: 'back',
            size: fitSize(18),
            color: STYLE_CONSTANT.appHeaderTextColor,
          }}
          containerStyle={styles.rightButton}
          onPress={this._onGoBack}
          type={ButtonType.clear}
        />
      )
    );
  }

  _renderInfo() {
    const sysVersion = `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`;
    const ClientVersion = DeviceInfo.getReadableVersion();
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const userAgent = DeviceInfo.getUserAgent();
    return (
      this.state.showInfo && (
        <Alert
          onClose={() => {
            this.setState({
              showInfo: false,
            });
            Clipboard.setString(`${sysVersion}/${DEVICE_INFO.ID}/${ClientVersion}/${brand}/${model}/${userAgent}`);
          }}
          closeOnClickModal={false}
        >
          <Text>{`SysVersion: ${sysVersion}`}</Text>
          <Text>{`DeviceId: ${DEVICE_INFO.ID}`}</Text>
          <Text>{`ClientVersion: ${ClientVersion}`}</Text>
          <Text>{`Brand: ${brand}`}</Text>
          <Text>{`Model: ${model}`}</Text>
          <Text>{`UserAgent: ${userAgent}`}</Text>
          <Text>{`Channel: ${CHANNEL}-${MARKET}`}</Text>
        </Alert>
      )
    );
  }

  _renderTitle() {
    const { title } = this.props;
    return (
      title && (
        <Text
          numberOfLines={1}
          onPress={() => {
            this.count += 1;
            if (this.count > 5) {
              this.setState({
                showInfo: true,
              });
            }
            clearTimeout(this.countTimeout);
            this.countTimeout = setTimeout(() => {
              this.count = 0;
            }, 500);
          }}
          style={styles.title}
        >
          {title}
        </Text>
      )
    );
  }

  _renderRight() {
    const { rightButtons } = this.props;
    if (rightButtons) {
      // eslint-disable-next-line no-confusing-arrow
      return rightButtons.map(item => item.icon ? (
        <Button
          key={item.icon}
          icon={{
            name: item.icon,
            size: fitSize(18),
            color: STYLE_CONSTANT.appHeaderTextColor,
          }}
          containerStyle={styles.rightButton}
          onPress={item.onPress}
          type={ButtonType.clear}
          setRef={ref => item.onRef && item.onRef(ref)}
        />
      ) : (
        <Button
          key={item.title}
          title={item.title}
          containerStyle={styles.rightButton}
          titleStyle={{ fontSize: fitSize(16) }}
          onPress={item.onPress}
          color={STYLE_CONSTANT.appHeaderTextColor}
          type={ButtonType.clear}
          setRef={ref => item.onRef && item.onRef(ref)}
        />
      ));
    }
    return null;
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.left}>{this._renderLeft()}</View>
        {this._renderTitle()}
        {this._renderInfo()}
        <View style={styles.right}>{this._renderRight()}</View>
      </View>
    );
  }
}
