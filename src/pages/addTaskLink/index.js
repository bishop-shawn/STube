// @flow
import React, { Component } from 'react';
import { StyleSheet, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import Button from '../../components/button';
import Input from '../../components/input';
import PageContainer from '../../components/pageContainer';
import { isURLSupported } from '../../util/taskUtil';
import { fitSize } from '../../util/baseUtil';
import AppHeader from '../../components/appHeader';
import DownloadAction from '../../redux/actions/download';
import reporter, { REPORT_KEYS, DataMap } from '../../util/reporter';

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: fitSize(20),
    marginHorizontal: fitSize(15),
    height: fitSize(140),
    marginBottom: fitSize(30),
    borderWidth: 1,
    borderRadius: 4,
    borderColor: 'gray',
    backgroundColor: 'white',
    paddingRight: fitSize(20),
  },
  input: {
    height: fitSize(140),
    textAlignVertical: 'top',
    textAlign: 'left',
    borderWidth: 0,
  },
  errorMsg: {
    fontSize: fitSize(14),
  },
  buttonContainer: {
    marginHorizontal: fitSize(15),
    height: fitSize(40),
  },
  buttonTitle: {
    fontSize: fitSize(16),
  },
});

type Props = {
  navigation: Object,
  dispatch: Function,
};

type State = {
  url: string,
  parseError: string,
};

class AddNewLink extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      url: null,
      parseError: null,
    };
    this._magnetHash = null;
  }

  async componentDidMount() {
    this.setState({
      url: (await Clipboard.getString()) || '',
    });
  }

  _updateUrl = (url: string) => {
    this.setState({ url });
  };

  _createNewTask = () => {
    const validateUrl = this.state.url.trim();
    const parsedUrl = validateUrl.split(/\s+/)[0];
    const urlSupported = isURLSupported(parsedUrl);
    if (urlSupported) {
      this.setState({ parseError: null });
      this.props.dispatch(
        DownloadAction.createTask({
          url: parsedUrl,
          successCallBack: () => {
            reporter.create({
              [REPORT_KEYS.from]: DataMap.from_add_link,
              [REPORT_KEYS.type]: DataMap.type_download,
              [REPORT_KEYS.url]: parsedUrl,
            });
            this.props.navigation.goBack();
          },
        }),
      );
    } else {
      this.setState({ parseError: '下载链接格式不支持' });
    }
  };

  render() {
    const { url } = this.state;
    return (
      <PageContainer>
        <AppHeader title="添加下载链接" navigation={this.props.navigation} />
        <Input
          value={this.state.url}
          autoFocus
          placeholder="支持http、ftp等下载专用链资源链接"
          onChangeText={this._updateUrl}
          multiline
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
          errorMsg={this.state.parseError}
          showClear
          onClear={() => {
            this.setState({ url: null });
          }}
          errorMsgStyle={styles.errorMsg}
        />
        <Button containerStyle={styles.buttonContainer} title="下 载" onPress={this._createNewTask} disabled={url === '' || url === null} titleStyle={styles.buttonTitle} />
      </PageContainer>
    );
  }
}

export default connect()(AddNewLink);
