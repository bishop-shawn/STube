// @flow
import Realm from 'realm';
import WatchRecord from '../model/watchRecord';

const WatchRecordSchema = {
  name: 'WatchRecord',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    size: 'int',
    watchTime: 'date',
    playProgress: 'int',
    taskId: 'string',
    subTaskIndex: 'int',
    fromHome: 'bool',
    taskUrl: 'string',
  },
};

const schemaVersion = 4;
const migration = {
  schema: [WatchRecordSchema],
  schemaVersion,
  // migration: (oldRealm, newRealm) => {
  //   // only apply this change if upgrading to schemaVersion 1
  //   if (oldRealm.schemaVersion < schemaVersion) {
  //     const oldObjects = oldRealm.objects(WatchRecordSchema.name);
  //     const newObjects = newRealm.objects(WatchRecordSchema.name);

  //     // loop through all objects and set the name property in the new schema
  //     for (let i = 0; i < oldObjects.length; i += 1) {
  //       newObjects[i].id = oldObjects[i].id;
  //       newObjects[i].name = oldObjects[i].name;
  //       newObjects[i].size = oldObjects[i].size;
  //       newObjects[i].watchTime = oldObjects[i].watchTime;
  //       newObjects[i].playProgress = oldObjects[i].playProgress;
  //       newObjects[i].taskId = oldObjects[i].taskId;
  //     }
  //   }
  // },
  deleteRealmIfMigrationNeeded: true,
};

const realm = new Realm(migration);

const schemaToRecord = schema => {
  const watchRecord = new WatchRecord();
  watchRecord.id = schema.id;
  watchRecord.name = schema.name;
  watchRecord.subTaskIndex = schema.subTaskIndex;
  watchRecord.fromHome = schema.fromHome;
  watchRecord.playProgress = schema.playProgress;
  watchRecord.size = schema.size;
  watchRecord.taskId = schema.taskId;
  watchRecord.taskUrl = schema.taskUrl;
  watchRecord.watchTime = schema.watchTime;
  return watchRecord;
};

const commit = action => {
  realm.write(action);
};

const addWatchRecord = (watchRecord: WatchRecord) => {
  commit(() => {
    realm.create(WatchRecordSchema.name, { ...watchRecord }, true);
  });
};

const getRecordsFromHome = () => realm
  .objects(WatchRecordSchema.name)
  .filtered('fromHome = true')
  .sorted('watchTime', true)
  .map(schemaToRecord);

const getAllWatchRecords = () => realm
  .objects(WatchRecordSchema.name)
  .sorted('watchTime', true)
  .map(schemaToRecord);

const getRecordByTaskUrl = (taskUrl: string) => realm
  .objects(WatchRecordSchema.name)
  .filtered(`taskUrl BEGINSWITH[c] "${taskUrl}"`)
  .sorted('watchTime', true)
  .map(schemaToRecord);

const deleteWatchRecords = (recordIds: string[]) => {
  commit(() => {
    recordIds.forEach(recordId => {
      const record = realm.objectForPrimaryKey(WatchRecordSchema.name, recordId);
      realm.delete(record);
    });
  });
};

const deleteRecordsByTaskId = (taskIds: string[]) => {
  commit(() => {
    taskIds.forEach(taskId => {
      const records = realm.objects(WatchRecordSchema.name).filtered(`taskId = "${taskId}"`);
      realm.delete(records);
    });
  });
};

export default {
  getAllWatchRecords,
  getRecordsFromHome,
  addWatchRecord,
  deleteWatchRecords,
  getRecordByTaskUrl,
  deleteRecordsByTaskId,
};
