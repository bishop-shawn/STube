// @flow
import React, { Component } from 'react';
import { StyleSheet, FlatList, Text } from 'react-native';
import PageContainer from '../../components/pageContainer';
import AppHeader from '../../components/appHeader';
import { fitSize } from '../../util/baseUtil';
import request from '../../util/request';
import EmptyHint from '../../components/emptyHint';

const styles = StyleSheet.create({
  item: {
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    padding: fitSize(15),
    fontSize: fitSize(14),
  },
});

type Props = {
  navigation: Object,
};

export default class PopularizeHistory extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.state = {
      history: [],
    };
  }

  componentDidMount() {
    request
      .post('/get/invite/records')
      .then(data => {
        this.setState({
          history: data.records,
        });
      })
      .catch(() => {});
  }

  _renderEmpty = () => <EmptyHint title="暂无邀请记录" image={require('../../resource/no_invite_records.png')} />;

  render() {
    return (
      <PageContainer>
        <AppHeader title="邀请记录" navigation={this.props.navigation} />
        <FlatList
          contentContainerStyle={this.state.history.length > 0 ? {} : { flex: 1, justifyContent: 'center', alignItems: 'center' }}
          data={this.state.history}
          renderItem={({ item }) => <Text style={styles.item}>{`${item.ts}  邀请了1位用户`}</Text>}
          keyExtractor={item => item.deviceid}
          ListEmptyComponent={this._renderEmpty}
        />
      </PageContainer>
    );
  }
}
