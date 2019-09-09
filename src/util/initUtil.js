// @flow
import { NativeModules } from 'react-native';
import fs from 'react-native-fs';
import { DEVICE_INFO, VOD_VALID_TIME, TASK_TYPE } from '../constant';
import storageService from '../service/storageService';
import DownloadSDK from '../sdk/downloadSDK';
import backgroundService from '../service/backgroundService';
import updateChecker from '../components/updateChecker';
import announcement from '../components/announcement';
import { getUsedStorage } from './baseUtil';
import DeviceInfo from './deviceInfo';
import downloadService from '../service/downloadService';
import watchRecordService from '../service/watchRecordService';
import store from '../redux/store';
import DownloadAction from '../redux/actions/download';
import configService from '../service/configService';

const { NativeHelper } = NativeModules;

const deleteWatchRecord = async () => {
  const threshold = 10; // if  downloaded file size / system remain space > threshold, clean the file of watch records
  const usedStorage = await getUsedStorage();
  const avalibleStorage = await DeviceInfo.getFreeDiskStorage();

  const tasks = await downloadService.fetchAllTasks();
  const canDeleteTasks = tasks.filter(task => !task.visible);
  const canDeleteTaskIds = canDeleteTasks.map(task => task.id);
  const canDeleteRecords = watchRecordService.getRecordsFromHome().filter((record: WatchRecord) => canDeleteTaskIds.includes(record.taskId));
  const expiredWatchRecords = canDeleteRecords.filter((record: WatchRecord) => Date.now() - record.watchTime.getTime() > VOD_VALID_TIME);
  const expiredWatchRecordsSize = expiredWatchRecords.reduce((acc, record: WatchRecord) => acc + record.size, 0);

  let usedSizeAfterDelete = usedStorage - expiredWatchRecordsSize;
  let avalibleSizeAfterDelete = avalibleStorage + expiredWatchRecordsSize;

  const needDeleteTaskIds = expiredWatchRecords.map((record: WatchRecord) => record.taskId);
  if (usedSizeAfterDelete / avalibleSizeAfterDelete > threshold) {
    const notExpiredWatchRecords = canDeleteRecords.filter((record: WatchRecord) => needDeleteTaskIds.indexOf(record.taskId) === -1);
    for (let i = notExpiredWatchRecords.length - 1; i >= 0; i -= 1) {
      const recordSize = notExpiredWatchRecords[i].size;
      if (usedSizeAfterDelete / avalibleSizeAfterDelete > threshold) {
        usedSizeAfterDelete -= recordSize;
        avalibleSizeAfterDelete += recordSize;
        needDeleteTaskIds.push(notExpiredWatchRecords[i].taskId);
      }
    }
  }

  if (needDeleteTaskIds.length > 0) {
    const torrentTasks = [];
    const infoHashes = [];
    canDeleteTasks.forEach((task: DownloadTask) => {
      const { type, id, infoHash } = task;
      if (type === TASK_TYPE.MAGNET) {
        torrentTasks.push(task);
      } else if (type === TASK_TYPE.BT && needDeleteTaskIds.includes(id)) {
        infoHashes.push(infoHash);
      }
    });
    torrentTasks.forEach((task: DownloadTask) => {
      if (infoHashes.find(infoHash => task.url.indexOf(infoHash) >= 0)) {
        needDeleteTaskIds.push(task.id);
      }
    });
    DownloadSDK.deleteTasks([...needDeleteTaskIds], true);
  }
};

const pauseAllTasks = async () => {
  const isInited = await DownloadSDK.isInited();
  if (!isInited) {
    setTimeout(() => {
      pauseAllTasks();
    }, 100);
    return;
  }
  const tasks = await DownloadSDK.getTasks();

  const taskIds = tasks.map(task => task._id);
  if (taskIds.length > 0) {
    store.dispatch(DownloadAction.pauseTasks(taskIds));
  }
};

export default {
  initApp: async () => {
    const downloadCfgPath = `${fs.DocumentDirectoryPath}/setting.cfg`;
    await fs.copyFileAssets('setting.cfg', downloadCfgPath);
    console.log('copy setting.cfg to', downloadCfgPath);
    // const exist = await fs.exists(downloadCfgPath);
    // console.log('copy result:', exist);
    const downloadPath = await DownloadSDK.init(`${NativeHelper.data_path}/db`);
    storageService.saveDownloadPath(downloadPath);
    DEVICE_INFO.ID = await DownloadSDK.getDeviceId();
    configService.init();
    await deleteWatchRecord();
    await pauseAllTasks();
    updateChecker.init();
    announcement.init();
    await DownloadSDK.initDHT();
    backgroundService.run();
  },
};
