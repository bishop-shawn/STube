import React from 'react';
import { Provider } from 'react-redux';
import RootSiblings from 'react-native-root-siblings';
import store from '../../redux/store';
import InterestPopUp from '../../components/interestPopUp';

let instance = null;

function close() {
  if (instance) {
    instance.destroy();
  }
}

function show(video, navigation) {
  if (instance) {
    instance.destroy();
  }
  instance = new RootSiblings(
    (
      <Provider store={store}>
        <InterestPopUp navigation={navigation} video={video} onFinished={close} showVideoDetailPopUp />
      </Provider>
    ),
  );
}

export default {
  show,
  close,
};
