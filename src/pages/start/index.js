// @flow
import React, { Component } from 'react';
import { StyleSheet, ImageBackground, Image, View, StatusBar, TouchableWithoutFeedback, Linking } from 'react-native';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import SplashScreen from 'react-native-splash-screen';
import fs from 'react-native-fs';
import { ROUTE_NAMES, STYLE_CONSTANT } from '../../constant';
import PageContainer from '../../components/pageContainer';
import { fitSize } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';
import Button from '../../components/button';
import updateChecker from '../../components/updateChecker';
import announcement from '../../components/announcement';
import configService from '../../service/configService';
import DownloadSDK from '../../sdk/downloadSDK';

const countInterval = 1000;
const hasNotch = DeviceInfo.getNotchHeight() > 0;
const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    top: fitSize(12),
    right: fitSize(18),
    width: fitSize(55),
    borderRadius: fitSize(15),
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    paddingHorizontal: 10,
  },
  buttonTitle: {
    color: 'white',
    fontSize: 14,
  },
  image: {
    width: STYLE_CONSTANT.screenWidth,
    height: hasNotch ? STYLE_CONSTANT.screenHeight : STYLE_CONSTANT.screenHeight - StatusBar.currentHeight,
  },
});
type Props = {
  navigation: Object,
  dispatch: Function,
};
type State = {
  restSeconds: number,
};

class Start extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      restSeconds: 5,
      adBase64: null,
    };
    this._launchImage = { uri: 'mipmap/launch_screen' };
    this._outLink = null;
    this._calledEnter = false;
  }

  componentDidMount() {
    // use default first
    configService.getConfig().then(config => {
      if (config) {
        this._setAd(config.imagePath);
        this._outLink = config.adImagelink;
      }
    });
    // wait remote response
    configService.once(configService.keys.image, async (path, link) => {
      this._setAd(path);
      this._outLink = link;
    });

    setTimeout(() => {
      SplashScreen.hide();
      this._countTimer = setTimeout(this._startCount, countInterval);
    }, 200);
  }

  _setAd = async (path) => {
    try {
      const data = await fs.readFile(path, 'base64');
      this.setState({
        adBase64: `data:image/png;base64,${data}`,
      });
    } catch (e) {
      console.log('Warning: read start_default.png error.');
    }
  }

  _startCount = () => {
    clearTimeout(this._countTimer);
    this._countTimer = null;
    const { restSeconds } = this.state;
    if (restSeconds > 0) {
      this.setState({ restSeconds: restSeconds - 1 });
      this._countTimer = setTimeout(this._startCount, countInterval);
    }
  };

  _openOutLink = () => {
    if (this._outLink) {
      Linking.openURL(this._outLink);
    }
  };

  _enterApp = () => {
    if (this._calledEnter) {
      return;
    }
    this._calledEnter = true;
    updateChecker.check(true, {
      onClose: () => {
        announcement.show({
          onClose: () => {
            this.props.navigation.reset([NavigationActions.navigate({ routeName: ROUTE_NAMES.main })], 0);
          },
        });
      },
    });
    this._initDownloadProxy();
  };

  async _initDownloadProxy() {
    const re = await DownloadSDK.initProxy();
    console.log('_initDownloadProxy: ', re);
    if (!re) {
      setTimeout(this._initDownloadProxy.bind(this), 1000);
    }
  }

  render() {
    const { restSeconds } = this.state;
    const title = restSeconds === 0 ? '进入' : restSeconds;
    return (
      <PageContainer style={{ borderColor: 'black' }}>
        <ImageBackground style={styles.image} source={this._launchImage}>
          <TouchableWithoutFeedback onPress={this._openOutLink}>
            <View style={styles.image}>{this.state.adBase64 && <Image style={styles.image} source={{ uri: this.state.adBase64 }} />}</View>
          </TouchableWithoutFeedback>
        </ImageBackground>
        <Button disabled={restSeconds > 0} containerStyle={styles.buttonContainer} title={title} titleStyle={styles.buttonTitle} onPress={this._enterApp} />
      </PageContainer>
    );
  }
}

export default connect()(Start);
