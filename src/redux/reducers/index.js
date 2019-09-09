import { combineReducers } from 'redux';
import Download from './download';
import Common from './common';

const rootReducer = combineReducers({
  Download,
  Common,
});
export default rootReducer;
