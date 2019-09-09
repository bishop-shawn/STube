// @flow
import React, { Component, Children } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Keyboard, TouchableHighlight, ActivityIndicator, NativeModules } from 'react-native';
import { connect } from 'react-redux';
import PageContainer from '../../components/pageContainer';
import Loading from '../../components/loading';
import { STYLE_CONSTANT } from '../../constant';
import { fitSize, showToast, infoHashToMagnet } from '../../util/baseUtil';
import TagGroups from './tagGroups';
import request from '../../util/request';
import searchRecordService from '../../service/searchRecordService';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';
import SearchHeader from './searchHeader';
import Video from '../../model/video';
import showDialog from '../homeWebview/showDialog';

const { NativeHelper } = NativeModules;

const MAX_LENGTH = 50;
const styles = StyleSheet.create({
  resultItem: {
    paddingHorizontal: fitSize(20),
    paddingVertical: fitSize(10),
    borderBottomWidth: 1,
    borderBottomColor: STYLE_CONSTANT.seperatorColor,
    width: '100%',
  },
  btFolder: {
    width: fitSize(36),
    height: fitSize(36),
    marginRight: fitSize(10),
  },
  resultInfoContainer: {
    marginLeft: fitSize(46),
    justifyContent: 'center',
  },
  resultItemName: {
    flex: 1,
    color: STYLE_CONSTANT.fontBlackColor,
    fontSize: fitSize(14),
    height: fitSize(36),
    includeFontPadding: false,
  },
  resultItemSize: {
    color: STYLE_CONSTANT.fontGrayColor,
    fontSize: fitSize(11),
    width: '29%',
  },
  resultValue: {
    color: STYLE_CONSTANT.themeColor,
  },
  bodyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    height: fitSize(120),
    width: fitSize(141),
    marginBottom: fitSize(20),
  },
  emptyText: {
    fontSize: fitSize(14),
    color: STYLE_CONSTANT.fontGrayColor,
  },
  loadMore: {
    padding: fitSize(15),
    textAlign: 'center',
  },
  highlight: {
    color: STYLE_CONSTANT.themeColor,
  },
});

type Props = {
  navigation: Object,
  dispatch: Function,
};
class StackSearch extends Component<Props> {
  static navigationOptions = () => ({
    header: null,
    tabBarVisible: false,
  });

  constructor(props: Props) {
    super(props);
    this._tagValue = this.props.navigation.getParam('value', null);
    this._total = 0;
    this._searchingValue = '';
    this.state = {
      searchState: -1, // -1: idle, 0: searching, 1: completed
      searchValue: '',
      searchResult: [],
      autoFocus: !this._tagValue,
      currentPage: 1,
    };
  }

  componentDidMount() {
    if (this._tagValue) {
      this._search(this._tagValue, true);
    }
  }

  _renderTitle = title => {
    const splitTitle = title.split(/(<[/]?em>)/);
    return Children.map(splitTitle, (item, index) => {
      if (item === '<em>' || item === '</em>') return null;
      if (splitTitle[index - 1] === '<em>') return <Text style={styles.highlight}>{item}</Text>;
      return item;
    });
  };

  _onPressSearchItem = item => {
    const video = new Video(`${item.title.replace(/<\/?em>/g, '')}`, item.size, infoHashToMagnet(item.infohash), -1);
    video.from = DataMap.from_search_list;
    showDialog.show(video, this.props.navigation);
  };

  _renderSearchResult = () => {
    const { searchState, currentPage } = this.state;
    if (searchState === 0 && currentPage === 1) {
      return <Loading />;
    }
    if (this.state.searchResult.length > 0) {
      return (
        <FlatList
          data={this.state.searchResult}
          renderItem={({ item }) => (
            <TouchableHighlight
              underlayColor={STYLE_CONSTANT.checkedColor}
              // onLongPress={() => {
              //   Clipboard.setString(item.infohash);
              // }}
              onPress={() => {
                this._onPressSearchItem(item);
              }}
            >
              <View style={styles.resultItem}>
                <View style={{ flexDirection: 'row', marginTop: fitSize(2), width: '100%' }}>
                  <Image source={require('../../resource/BT_folder.png')} style={styles.btFolder} resizeMode="contain" />
                  <Text style={styles.resultItemName} numberOfLines={2}>
                    {this._renderTitle(item.title)}
                  </Text>
                </View>
                <View style={styles.resultInfoContainer}>
                  <View style={{ flexDirection: 'row', marginTop: fitSize(2) }}>
                    <Text style={[styles.resultItemSize, { width: '40%' }]}>
                      大小：<Text style={styles.resultValue}>{item.size}</Text>
                    </Text>
                    <Text style={styles.resultItemSize}>
                      文件数：<Text style={styles.resultValue}>{item.filenum}</Text>
                    </Text>
                    <Text style={styles.resultItemSize}>
                      热度：<Text style={styles.resultValue}>{item.score}</Text>
                    </Text>
                  </View>
                </View>
                {/* <Icon
                  name="download_continue"
                  color={STYLE_CONSTANT.themeColor}
                  size={fitSize(20)}
                  onPress={() => {
                    this._onPressSearchItem(item);
                  }}
                  style={{ padding: fitSize(10) }}
                /> */}
              </View>
            </TouchableHighlight>
          )}
          keyExtractor={(item, index) => `${index}`}
          ListFooterComponent={() => {
            if (searchState === 0 && currentPage > 1) {
              return (
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <ActivityIndicator style={styles.loadMore} size="small" color={STYLE_CONSTANT.themeColor} />
                </View>
              );
            }
            return this.state.searchResult.length >= this._total ? (
              <Text style={styles.loadMore}>没有更多了</Text>
            ) : (
              <Text style={styles.loadMore} onPress={this._loadMore}>
                点击加载更多
              </Text>
            );
          }}
        />
      );
    }
    return (
      <View style={styles.bodyContainer}>
        <Image style={styles.emptyImage} source={require('../../resource/load_failed.png')} />
        <Text style={styles.emptyText}>暂无相关资源</Text>
      </View>
    );
  };

  _trimInside = val => val.replace(/\s+/g, '');

  _getData = async (q, p = 1) => {
    const { searchResult } = this.state;
    let currentResult = [];
    this.setState({
      searchState: 0,
    });
    try {
      const { sources, total } = await request.search(this._trimInside(q), p);
      if (total > this._total) this._total = total;
      currentResult = sources;
      this.setState({
        currentPage: p + 1,
      });
    } catch (e) {
      showToast('出错了，请重试');
    }
    this.setState({
      searchResult: searchResult.concat(currentResult),
      searchState: 1,
    });
  };

  _search = async (value, tag: boolean) => {
    if (this.state.searchState === 0) {
      showToast('请等待搜索完毕');
      return;
    }
    let val = value || this.state.searchValue;
    if (!val) {
      showToast('搜索内容不能为空');
      return;
    }
    val = val.trim().slice(0, MAX_LENGTH);
    const isBlack = await NativeHelper.inBlackList(val);
    if (isBlack) {
      showToast('内容含有敏感词汇');
      return;
    }
    this._searchingValue = val;
    this.setState({
      searchValue: val,
      currentPage: 1,
      searchResult: [],
    });
    Keyboard.dismiss();
    searchRecordService.addSearchRecord(val);
    this._getData(val);
    reporter.search({
      [REPORT_KEYS.from]: tag ? DataMap.from_search_tag : DataMap.from_search_button,
      [REPORT_KEYS.details]: val,
    });
  };

  _loadMore = () => {
    const { currentPage } = this.state;
    this._getData(this._searchingValue, currentPage);
  };

  render() {
    return (
      <PageContainer>
        <SearchHeader
          editAble={true}
          onBack={() => {
            this.props.navigation.goBack();
          }}
          autoFocus={this.state.autoFocus}
          value={this.state.searchValue}
          onSearch={this._search}
          onChangeText={searchValue => {
            this.setState({ searchValue });
          }}
          onClear={() => {
            this.setState({ searchValue: '' });
          }}
        />
        <View style={{ flex: 1 }}>
          {this.state.searchState === -1 ? (
            <TagGroups
              onTagPress={value => {
                this._search(value, true);
              }}
              navigation={this.props.navigation}
            />
          ) : (
            this._renderSearchResult()
          )}
        </View>
      </PageContainer>
    );
  }
}

export default connect()(StackSearch);
