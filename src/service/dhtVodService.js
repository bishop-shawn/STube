import axios from 'axios';
import { isInfoHash } from '../util/taskUtil';

const LOCAL_SERVICE = 'http://127.0.0.1:2017';
const JSCMD = `${LOCAL_SERVICE}/jsCmd`;
const GETORID = `${LOCAL_SERVICE}/getorid`;
const TASK_TYPE = {
  ORION: 0,
  HTTP: 1,
  FTP: 2,
  ED2K: 4,
  BT: 5,
};

const getTaskType = (val) => {
  const uri = val.trim();
  if (isInfoHash(uri)) {
    return TASK_TYPE.BT;
  }
  const url = new URL(uri);
  switch (url.protocol) {
    case 'orid:':
      return TASK_TYPE.ORION;
    case 'http:':
    case 'https:':
      return TASK_TYPE.HTTP;
    case 'ftp:':
      return TASK_TYPE.FTP;
    case 'ed2k:':
      return TASK_TYPE.ED2K;
    default:
      throw new Error(`Unsupported url: ${val}`);
  }
};

const DhtVodService = {
  start: async (url, index = 0) => {
    const res = await axios.post(JSCMD, {
      cmd: 'DownloadTaskCreate',
      task_url: url,
      file_name: '',
      file_index: index,
      task_type: getTaskType(url),
    });
    const { data } = res;
    if (data.code !== 0) {
      throw new Error(`Start DHT task failed: ${JSON.stringify(data)}`);
    }
    return {
      taskId: data.data.task_id,
      playUrl: data.data.play_url,
    };
  },
  stop: async (taskId) => {
    const res = await axios.post(JSCMD, {
      cmd: 'DownloadTaskStop',
      task_ids: [taskId],
    });
    const { data } = res;
    if (data.code !== 0) {
      throw new Error(`Stop DHT task failed: ${JSON.stringify(data)}`);
    }
  },
  getPlayList: async (url) => {
    const res = await axios.post(GETORID, {
      type: getTaskType(url),
      index: url,
    });
    const { data } = res;
    if (data.errno !== 0) {
      throw new Error(`Get DHT task failed: ${JSON.stringify(data)}`);
    }
    return data.info;
  },
  getInfo: async (taskId) => {
    const res = await axios.post(JSCMD, {
      cmd: 'GetTaskInfo',
    });
    const { data } = res;
    if (data.code !== 0) {
      throw new Error(`Get DHT info failed: ${JSON.stringify(data)}`);
    }
    return data.tasks.find((task) => task.task_id === taskId);
  },
};

export default DhtVodService;
