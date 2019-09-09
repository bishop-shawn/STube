// @flow
import ActionType from '../actionType';

function updateStorageInfo(avalibleStorage: number) {
  return { type: ActionType.UPDATE_STORAGE_INFO, data: { avalibleStorage } };
}

function updateConnectionStatus(connectionStatus: string) {
  return { type: ActionType.UPDATE_CONNECTION_STATUS, data: connectionStatus };
}

export default {
  updateStorageInfo,
  updateConnectionStatus,
};
