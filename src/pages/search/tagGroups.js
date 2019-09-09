// @flow
import React, { Component } from 'react';
import { ScrollView, View, StatusBar } from 'react-native';
import { STYLE_CONSTANT, PAGE_APPEAR_STATUS } from '../../constant';
import TagGroup from './tagGroup';
import { showToast, fitSize } from '../../util/baseUtil';
import DeviceInfo from '../../util/deviceInfo';
import searchTagsService from '../../service/searchTagsService';
import searchRecordService from '../../service/searchRecordService';
import configService from '../../service/configService';
import AdComponent from '../../components/adComponent';

type Props = {
  onTagPress?: Function,
  navigation: Object,
};

export default class TagGroups extends Component<Props> {
  static defaultProps = {
    onTagPress: () => {},
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hotwords: [],
      loading: true,
      // get sync data first
      tags: searchRecordService.getAllSync(),
      adBase64: null,
      adLink: null,
    };
  }

  async componentDidMount() {
    this._updateData();
    // Prevent _updateData triggering twice
    setTimeout(() => {
      this._willFocusListener = this.props.navigation.addListener(PAGE_APPEAR_STATUS.willFocus, this._updateData);
    }, 100);
    configService.once(configService.keys.searchAd, (path, link, base64) => {
      this.setState({
        adBase64: base64,
        adLink: link,
      });
    });
  }

  componentWillUnmount() {
    if (this._willFocusListener) {
      this._willFocusListener.remove();
    }
  }

  _updateData = () => {
    // console.log('tagGroups update data!');
    searchRecordService.getAll().then(tags => {
      this.setState({ tags });
    });
    searchTagsService.getTags().then(hotwords => {
      this.setState({ hotwords, loading: false });
    });
  };

  _cleanHistory = () => {
    searchRecordService.clear();
    this.setState({ tags: [] });
    showToast('已清除');
  };

  render() {
    const { onTagPress } = this.props;
    const { hotwords, loading, adBase64, adLink } = this.state;
    return (
      <ScrollView contentContainerStyle={{ minHeight: STYLE_CONSTANT.screenHeight - fitSize(106) - (DeviceInfo.getNotchHeight() > 0 ? 0 : StatusBar.currentHeight) }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <TagGroup title="搜索历史" onTagPress={onTagPress} tags={this.state.tags} color={STYLE_CONSTANT.fontGrayColor} showClean onClean={this._cleanHistory} />
            <TagGroup title="热门电影标签" onTagPress={onTagPress} tags={hotwords} loading={loading} />
          </View>
          <AdComponent base64={adBase64} link={adLink} />
        </View>
      </ScrollView>
    );
  }
}
