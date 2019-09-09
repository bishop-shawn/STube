// @flow
import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import Input from '../../components/input';
import Confirm from '../../components/confirm';
import { fitSize } from '../../util/baseUtil';

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: fitSize(5),
    width: '100%',
  },
  input: {
    borderWidth: 0,
    backgroundColor: 'rgb(240,241,243)',
    borderRadius: 2,
    paddingLeft: 5,
    paddingRight: fitSize(30),
    fontSize: fitSize(13),
  },
  clearStyle: {
    height: fitSize(35),
    bottom: fitSize(12),
    top: undefined,
  },
});

type Props = {
  onClose: Function,
  rename: Function,
  preName: string,
};

type State = {
  newName: string,
  errorMsg: string,
};

export default class RenamePopUp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      newName: props.preName,
      errorMsg: null,
    };
  }

  _rename = () => {
    const { newName } = this.state;
    if (newName) {
      this.props.rename(newName);
      this.props.onClose();
    }
  };

  _updateName = (newName: string) => {
    if (newName.length > 100) {
      this.setState({
        errorMsg: '超出最大命名长度',
      });
    } else {
      this.setState({
        newName,
      });
    }
  };

  render() {
    const { onClose } = this.props;
    return (
      <Confirm title="重命名" onClose={onClose} onConfirm={this._rename}>
        <Input
          onChangeText={this._updateName}
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
          clearStyle={styles.clearStyle}
          showClear
          value={this.state.newName}
          errorMsg={this.state.errorMsg}
          onClear={() => {
            this.setState({
              newName: null,
            });
          }}
        />
      </Confirm>
    );
  }
}
