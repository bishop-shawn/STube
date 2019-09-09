// @flow
import { Dimensions, Platform, NativeModules } from 'react-native';
import Config from 'react-native-config';

const { NativeHelper } = NativeModules;
const { height, width } = Dimensions.get('window');

export const { CHANNEL } = Config;
export const MARKET = NativeHelper.market;

export const SETTINGS = {
  adImageUrl: NativeHelper.launch_ad_image,
  adImagelink: NativeHelper.launch_ad_link,
  adVideoUrl: NativeHelper.ad_video_url,
  adVideoLink: NativeHelper.ad_video_link,
};

export const STYLE_CONSTANT = {
  themeColor: NativeHelper.color_theme || '#f13564',
  appHeaderColor: NativeHelper.color_header || '#f13564',
  appHeaderTextColor: NativeHelper.color_header_text || '#ffffff',
  appBottomColor: NativeHelper.color_bottom || '#fff',
  appBottomTextColor: NativeHelper.color_bottom_text || '#a1a1a1',
  appBottomTextActiveColor: NativeHelper.color_bottom_text_active || '#000',
  appBackgroundColor: 'white',
  seperatorColor: '#D2D2D2',
  fontGrayColor: 'rgb(161, 161, 161)',
  fontBlackColor: 'black',
  fontOrangeColor: 'rgb(248, 91, 23)',
  checkedColor: '#EAEAEA',
  itemBackgroundColor: 'rgb(243, 244, 246)',
  screenWidth: width,
  screenHeight: height,
};

export const TASK_STATUS = {
  PENDING: 1,
  RUNNING: 2,
  PAUSED: 3,
  SUCCESS: 4,
  FAILED: 5,
};

export const TASK_CODE = {
  PENDING: 190,
  RUNNING: 192,
  PAUSED: 193,
  WAITING_TO_RETRY: 194,
  WAITING_FOR_NETWORK: 195,
  QUEUED_FOR_WIFI: 196,
  INSUFFICIENT_SPACE_ERROR: 198,
  DEVICE_NOT_FOUND_ERROR: 199,
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_ACCEPTABLE: 406,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  FILE_ALREADY_EXISTS: 488, // not http code
  CANNOT_RESUME: 489,
  CANCELED: 490,
  UNKNOWN_ERROR: 491,
  FILE_ERROR: 492, // stroage full or disk cannot be found
  UNHANDLED_REDIRECT: 493,
  UNHANDLED_HTTP_CODE: 494,
  HTTP_DATA_ERROR: 495,
  HTTP_EXCEPTION: 496,
  TOO_MANY_REDIRECTS: 497,
  PEER_NOT_FOUND_ERROR: 500,
  TIMEOUT: 501,
  DOWNLOADSDK_NOT_INIT: 502,
};

export const TASK_TYPE = {
  UNKOWN: 0,
  HTTP: 1,
  FTP: 2,
  MAGNET: 3,
  BT: 4,
  ED2K: 5,
  CID: 6,
  GROUP: 7,
};

export const ROUTE_NAMES = {
  start: 'Start',
  main: 'Main',
  home: 'Home',
  search: 'Search',
  stackSearch: 'StackSearch',
  download: 'Download',
  mine: 'Mine',
  watchRecords: 'WatchRecords',
  addNewLink: 'AddNewLink',
  scanBTFile: 'ScanBTFile',
  downloadingPlayer: 'DownloadingPlayer',
  downloadRecords: 'DownloadRecords',
  downloadSetting: 'DownloadSetting',
  popularize: 'Popularize',
  appQRCode: 'AppQRCode',
  webEntry: 'WebEntry',
  popularizeHistory: 'PopularizeHistory',
  setting: 'Setting',
  vodPlayer: 'VODPlayer',
};

export const IS_IOS = Platform.OS === 'ios';

export const PAGE_APPEAR_STATUS = {
  willBlur: 'willBlur',
  willFocus: 'willFocus',
  didFocus: 'didFocus',
  didBlur: 'didBlur',
};

export type ReadDirItem = {
  ctime: Date, // The creation date of the file (iOS only)
  mtime: Date, // The last modified date of the file
  name: string, // The name of the item
  path: string, // The absolute path to the item
  size: string, // Size in bytes
  isFile: () => boolean, // Is the file just a file?
  isDirectory: () => boolean, // Is the file a directory?
};

export const ORIENTATION_STATUS = {
  LANDSCAPE: 'LANDSCAPE',
  PORTRAIT: 'PORTRAIT',
  PORTRAITUPSIDEDOWN: 'PORTRAITUPSIDEDOWN',
  UNKNOWN: 'UNKNOWN',
};

export const CONNECTION_STATUS = {
  none: 'none', // oofline
  wifi: 'wifi',
  cellular: 'cellular',
  unknown: 'unknown',
};

export const DEVICE_INFO = {};

export const VOD_VALID_TIME = 24 * 3600 * 1000; // vido cache time(ms).
