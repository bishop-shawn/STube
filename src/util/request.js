/* eslint-disable max-len */
import { NativeModules } from 'react-native';
import { DEVICE_INFO, CONNECTION_STATUS, CHANNEL, MARKET } from '../constant';
import { showToast } from './baseUtil';
import DeviceInfo from './deviceInfo';
import { DataError } from './errors';
import bxios from './bxios';
import reporter, { DataMap, REPORT_KEYS } from './reporter';

const TIMEOUT = 15000;

const platform = 'Android';
const clientVersion = DeviceInfo.getVersion();
const host = 'cdb1b041856704d6e8325eb52a76f4cb';
const searchHost = '25e9b3fe2c98ddde650aea3f931dfbe1';
const version = 'v2';

async function getSignature(url, body, timestamp) {
  const signatureStr = DEVICE_INFO.ID + platform + clientVersion + url + timestamp + (body || '');
  const signature = await NativeModules.NativeHelper.getSignature(signatureStr);
  console.log('REQUEST headers: ', signatureStr, signature);
  return signature;
}

function join(...paths) {
  const result = paths.join('/');
  return result.replace(/([^:])[/]{2,}/g, '$1/');
}

function isOffline() {
  if (global.connectionInfo === CONNECTION_STATUS.none || global.connectionInfo === CONNECTION_STATUS.unknown) {
    return true;
  }
  return false;
}

const baseRequest = async (options, reporterApi) => {
  const baseTimpstamp = Date.now();
  return bxios(options)
    .then(res => {
      const { data } = res;
      console.log('REQUEST response: ', JSON.stringify(data));

      if (data && data.result === 0) {
        // report 'request successed'
        reporter.request({
          [REPORT_KEYS.url]: reporterApi,
          [REPORT_KEYS.status]: DataMap.status_success,
          [REPORT_KEYS.delay]: Date.now() - baseTimpstamp,
        });
        return data.data;
      }
      throw new DataError(data.result);
    })
    .catch(e => {
      let errorStatus = DataMap.status_data_error;
      console.log('REQUEST error: ', e.message);
      if (e.message.includes('time')) {
        showToast(`请求超时：${reporterApi}`);
        errorStatus = DataMap.status_timeout;
      } else if (!(e instanceof DataError)) {
        showToast(`请求失败：${reporterApi}`);
        errorStatus = DataMap.status_fail;
      }
      // report 'request failed'
      reporter.request({
        [REPORT_KEYS.url]: reporterApi,
        [REPORT_KEYS.status]: errorStatus,
        [REPORT_KEYS.delay]: Date.now() - baseTimpstamp,
      });
      throw e;
    });
};

const certRequest = async (api, options) => {
  if (isOffline()) {
    showToast('无网络连接');
    return Promise.reject(new Error('network offline'));
  }

  api = `/${join(version, api)}`;
  const url = join(host, api);
  const timestamp = Math.floor(Date.now() / 1000);

  const defaultHeaders = {
    Host: 'cdb1b041856704d6e8325eb52a76f4cb',
    Accept: 'application/json, text/plain, */*',
    Deviceid: DEVICE_INFO.ID,
    Platform: platform,
    'Client-Version': clientVersion,
    Timestamp: timestamp,
    Signature: await getSignature(api, options.data, timestamp),
    Channel: CHANNEL,
    Market: MARKET,
  };
  const { headers } = options;
  console.log('REQUEST url:', url);
  options.headers = Object.assign(defaultHeaders, headers);

  return baseRequest(
    {
      url,
      ...options,
      timeout: TIMEOUT,
    },
    api,
  );
};

const search = (q, p = 1) => {
  if (isOffline()) {
    showToast('无网络连接');
    return Promise.reject(new Error('network offline'));
  }
  return baseRequest(
    {
      url: `${searchHost}/api/search?p=${p}&q=${q}`,
      headers: {
        Host: '25e9b3fe2c98ddde650aea3f931dfbe1',
        Accept: 'application/json, text/plain, */*',
      },
      method: 'get',
      timeout: 15000,
    },
    '/search',
  );
};

export default {
  isOffline,
  search,
  get: (api, data, isConcurrent) => certRequest(api, {
    method: 'get',
    data,
    isConcurrent,
  }),
  post: (api, data, isConcurrent) => certRequest(api, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    isConcurrent,
  }),
};
