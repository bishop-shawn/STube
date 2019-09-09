// @flow
import React, { Component } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import PageContainer from '../../components/pageContainer';
import AppHeader from '../../components/appHeader';
import Button from '../../components/button';
import { STYLE_CONSTANT, ROUTE_NAMES } from '../../constant';
import { fitSize } from '../../util/baseUtil';
import request from '../../util/request';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: fitSize(20),
    marginVertical: fitSize(50),
    paddingHorizontal: fitSize(10),
    paddingVertical: fitSize(15),
    borderRadius: fitSize(5),
    borderWidth: 1,
    borderColor: '#efefef',
  },
  topLine: {
    paddingBottom: fitSize(20),
    marginBottom: fitSize(20),
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  highLight: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontOrangeColor,
  },
  text: {
    fontSize: fitSize(12),
    color: STYLE_CONSTANT.fontGrayColor,
  },
  popularizeItem: {
    flexDirection: 'row',
    paddingBottom: fitSize(5),
  },
});

type Props = {
  navigation: Object,
};

export default class Popularize extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.state = {
      level: [],
    };
  }

  componentDidMount() {
    request
      .post('/get/invite/level/cfg')
      .then(data => {
        const level = [];
        data.level.forEach((item, index) => {
          const last = level[index - 1];
          level[index] = item;
          if (level[index].task_quota > 1000) {
            level[index].task_quota = '无限';
          } else if (last) {
            level[index].task_quota += last.task_quota;
          }
        });
        this.setState({
          level,
        });
      })
      .catch(() => {});
  }

  _renderList = () => (
    <FlatList
      style={{ marginBottom: fitSize(40), minHeight: fitSize(200) }}
      data={this.state.level}
      renderItem={({ item }) => (
        <View style={styles.popularizeItem}>
          <Text style={styles.text}>推广</Text>
          <Text style={styles.highLight}>{item.count}</Text>
          <Text style={styles.text}>人，每日免费次数</Text>
          <Text style={styles.highLight}>{`+${item.task_quota}`}</Text>
        </View>
      )}
      keyExtractor={item => `${item.p}`}
    />
  );

  render() {
    return (
      <PageContainer>
        <AppHeader title="我要推广" navigation={this.props.navigation} />
        <ScrollView>
          <View style={styles.container}>
            <Text style={[styles.highLight, { paddingBottom: fitSize(20), fontSize: fitSize(14) }]}>推广任务</Text>
            <Text style={[styles.text, styles.topLine]}>邀请好友下载APP并填写邀请码，可获得免费权益次数，可用于观影&高速下载。</Text>
            {this._renderList()}
          </View>
          <Button
            title="立即推广"
            containerStyle={{
              padding: fitSize(20),
              marginHorizontal: fitSize(25),
              height: fitSize(40),
            }}
            onPress={() => {
              this.props.navigation.navigate(ROUTE_NAMES.appQRCode);
            }}
            titleStyle={{ fontSize: fitSize(16) }}
          />
        </ScrollView>
      </PageContainer>
    );
  }
}
