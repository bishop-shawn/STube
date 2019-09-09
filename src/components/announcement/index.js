import React from 'react';
import RootSiblings from 'react-native-root-siblings';
import moment from 'moment';
import Announcement from './announcement';
import request from '../../util/request';

let instance = null;
let onCloseHandler = null;
let result = null;

function init() {
  if (!result) {
    result = request.post('/get/notice');
    result.catch(() => {});
  }
  return result;
}

function triggerCloseHandler() {
  // eslint-disable-next-line no-unused-expressions
  onCloseHandler && onCloseHandler();
  onCloseHandler = null;
}

function close() {
  if (instance) {
    instance.destroy();
    instance = null;
    triggerCloseHandler();
  }
}

async function show(config) {
  onCloseHandler = config && config.onClose;
  try {
    const res = await init();
    result = null;
    let title = '';
    let contents = '';
    // expire
    if (res.expire * 1000 < Date.now()) {
      triggerCloseHandler();
      return;
    }
    if (res.type === 1) {
      title = '活动公告';
      const startTime = moment(new Date(res.stime * 1000)).format('YYYY-MM-DD');
      const endTime = moment(new Date(res.etime * 1000)).format('YYYY-MM-DD');
      contents = [`${startTime} ~ ${endTime}`, res.content];
    } else if (res.type === 2) {
      title = '官方公告';
      contents = res.content;
    } else {
      triggerCloseHandler();
      return;
    }
    instance = new RootSiblings(<Announcement title={title} contents={contents} onClose={close} />);
  } catch (e) {
    triggerCloseHandler();
  }
}

export default {
  init,
  show,
  close,
};
