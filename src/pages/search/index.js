// @flow
import React, { Component } from 'react';
import PageContainer from '../../components/pageContainer';
import { ROUTE_NAMES } from '../../constant';
import TagGroups from './tagGroups';
import SearchHeader from './searchHeader';
import { transitionTypes } from '../../util/transitions';

type Props = {
  navigation: Object,
};

export default class Search extends Component<Props> {
  static navigationOptions = () => ({
    header: null,
    tabBarVisible: false,
  });

  componentDidMount() {
    this.props.navigation.setParams({
      onPress: this._gotoSearch,
    });
  }

  _gotoSearchWithNoParms = () => {
    this._gotoSearch();
  };

  _gotoSearch = value => {
    this.props.navigation.navigate(ROUTE_NAMES.stackSearch, {
      value,
      transition: transitionTypes.none,
    });
  };

  render() {
    return (
      <PageContainer>
        <SearchHeader onLeftPress={this._gotoSearchWithNoParms} onPress={this._gotoSearchWithNoParms} onBack={this._gotoSearchWithNoParms} />
        <TagGroups onTagPress={this._gotoSearch} navigation={this.props.navigation} />
      </PageContainer>
    );
  }
}
