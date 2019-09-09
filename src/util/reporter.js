// @flow
/* eslint-disable no-console */
import { DEVICE_INFO, CHANNEL, MARKET } from '../constant';
import DeviceInfo from './deviceInfo';
import bxios from './bxios';

const host = '9f51425700210ef47014ca5645e59d97';
// const host = '014762c31f4706bc1df62dacf66ae3cb';
const apiVersion = 'v2';
const platform = 'Android';
const clientVersion = DeviceInfo.getVersion();
const systemVersion = DeviceInfo.getSystemVersion();

const EventNames = {
  access: 'access',
  search: 'search',
  create: 'create',
  delete: 'delete',
  complete: 'complete',
  enterPlay: 'enterPlay',
  media: 'media',
  request: 'request',
  switchLine: 'switchLine',
};

export const DataMap = {
  from_bottom_tab: 0,
  from_mine: 2,
  from_player: 3,
  from_sites: 4, // site form home page
  from_films: 5, // hot movies
  from_search_list: 6,
  from_add_link: 7,
  from_add_bt: 8,
  from_search_button: 9,
  from_search_tag: 10,
  from_xl_line: 11,
  from_dht_line: 12,
  status_fail: 0,
  status_success: 1,
  status_data_error: 2, // response data error
  status_timeout: 3,
  type_play: 1,
  type_download: 2, // download & download and play
};

const send = async (eventName, data) => {
  const headers = {
    Host: '9f51425700210ef47014ca5645e59d97',
    Deviceid: DEVICE_INFO.ID,
    Platform: `${platform} ${systemVersion}`,
    'Client-Version': clientVersion,
    Brand: DeviceInfo.getBrand(),
    Model: DeviceInfo.getModel(),
    'Package-Name': DeviceInfo.getBundleId(),
    'App-Name': DeviceInfo.getApplicationName(),
    Channel: `${CHANNEL}${MARKET}`,
  };
  console.log('REPORT headers: ', JSON.stringify(headers));
  const body = Object.assign(
    {
      event: eventName,
    },
    data,
  );
  const param = [];
  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    param.push(`${key}=${encodeURIComponent(body[key])}`);
  }
  param.push(`timestamp=${Date.now()}`);
  const fullUrl = `${host}/${apiVersion}/report?${param.join('&')}`;
  console.log(`REPORT url: ${fullUrl}`);
  return bxios({
    url: fullUrl,
    method: 'get',
    headers,
    timeout: 15000,
  })
    .then(() => {})
    .catch(() => {});
};

// home page，
// bottom tab，
// mine page
const access = (data: { type: number, name: string }) => {
  send(EventNames.access, data);
};

// search，search tag
const search = (data: { type: number, content: string }) => {
  send(EventNames.search, data);
};

// create task
const create = (data: { type: number, from: number, details: string, url: string }) => {
  send(EventNames.create, data);
};

// delete
const deleteTask = (data: { url: string }) => {
  send(EventNames.delete, data);
};

// download completed
const complete = (data: { url: string, avgSpeed: number }) => {
  send(EventNames.complete, data);
};

// navigate to videoPlayer（play，downlaod & play）
const enterPlay = (data: { type: number, url: string }) => {
  send(EventNames.enterPlay, data);
};

// player
const media = (data: { type: number, url: string, content: number }) => {
  send(EventNames.media, data);
};

// all request
const request = (data: { url: string, status: Number, delay: number }) => {
  send(EventNames.request, data);
};

const switchLine = (data: { url: string, from: number}) => {
  send(EventNames.switchLine, data);
};

export const REPORT_KEYS = {
  type: 'type',
  from: 'from',
  details: 'details',
  url: 'url',
  speed: 'speed',
  hash: 'hash',
  status: 'status',
  delay: 'delay',
};

export default {
  access,
  search,
  create,
  delete: deleteTask,
  complete,
  enterPlay,
  media,
  request,
  switchLine,
};
