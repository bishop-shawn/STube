import ActionType from '../actionType';
import { CONNECTION_STATUS } from '../../constant';

const initialState = {
  avalibleStorage: -1,
  connectionType: CONNECTION_STATUS.none,
};

export default function Common(state = initialState, action) {
  const { UPDATE_STORAGE_INFO, UPDATE_CONNECTION_STATUS } = ActionType;

  switch (action.type) {
    case UPDATE_STORAGE_INFO:
      return {
        ...state,
        avalibleStorage: action.data.avalibleStorage,
      };
    case UPDATE_CONNECTION_STATUS:
      return {
        ...state,
        connectionType: action.data,
      };
    default:
      return state;
  }
}
