import { TASK_TYPE, TASK_STATUS, TASK_CODE } from '../constant';
import DownloadTask from '../model/downloadTask';

const infoHashReg = /^[0-9a-fA-F]{40}$/;

const videoReg = /^(.*\.)?(wmv|asf|asx|rm|rmvb|mpeg|mp4|mpg|3gp|3g2|mov|m4v|avi|dat|mkv|flv|vob|webm|ogv|ogx|swf)[ ]*$/i;
const audioReg = /^(.*\.)?(mp3|m4a|wav|aac|aif|au|ram|wma|mmf|amr|flac|weba|oga|ogg)[ ]*$/i;
const txtReg = /^(.*\.)?(txt|nfo|info|doc|docx|htm|xhtml|html|xml|ppt|pptx|pdf)[ ]*$/i;
const imgReg = /^(.*\.)?(bmp|jpg|png|tif|gif|pcx|tga|exif|fpx|svg|psd|cdr|pcd|dxf|ufo|eps|ai|raw|WMF|webp)[ ]*$/i;
const zipReg = /^(.*\.)?(zip|rar|7z|tar|tgz)[ ]*$/i;
const apkReg = /^(.*\.)?apk$/i;
const magnetReg = /^magnet:.+/i;

function getCategory(type) {
  if (videoReg.test(type)) return 'video';
  if (audioReg.test(type)) return 'audio';
  if (txtReg.test(type)) return 'txt';
  if (imgReg.test(type)) return 'image';
  if (zipReg.test(type)) return 'zip';
  if (apkReg.test(type)) return 'apk';
  return 'other';
}

function isInfoHash(hash) {
  return infoHashReg.test(hash);
}

function isURLSupported(uri) {
  if (infoHashReg.test(uri)) {
    return true;
  }
  let url;
  try {
    url = new URL(uri);
  } catch (e) {
    return false;
  }
  switch (url.protocol) {
    case 'thunder:':
    case 'flashget:':
    case 'qqdl:':
    case 'magnet:':
    case 'http:':
    case 'https:':
    case 'ftp:':
    case 'ed2k:':
      return true;
    default:
      return false;
  }
}

function isMagnet(url) {
  return magnetReg.test(url);
}

function translateStatus(status) {
  switch (status) {
    case TASK_CODE.PENDING:
      return TASK_STATUS.PENDING;
    case TASK_CODE.RUNNING:
      return TASK_STATUS.RUNNING;
    case TASK_CODE.PAUSED:
    case TASK_CODE.WAITING_TO_RETRY:
    case TASK_CODE.WAITING_FOR_NETWORK:
    case TASK_CODE.QUEUED_FOR_WIFI:
      return TASK_STATUS.PAUSED;
    case TASK_CODE.SUCCESS:
      return TASK_STATUS.SUCCESS;
    default:
      return TASK_STATUS.FAILED;
  }
}

function translateErrorMessage(task) {
  switch (task.code) {
    case TASK_CODE.INSUFFICIENT_SPACE_ERROR:
    case 111085:
      return '存储空间不足，无法下载';
    case 111136:
      return '任务连接多次后失败，无法下载';
    case 111176:
      return '任务连接多次后超时，无法下载';
    case 111128:
      return '存储路径无法写入，无法下载';
    case 111127:
      return '续传任务失败，无法下载';
    case 114001:
    case 114101:
    case 114006:
      return '链接解析失败，无法下载';
    case 9302:
      return '种子文件无效';
    default:
      return '下载失败';
  }
}

function getCommonPoster(name) {
  const mediaType = getCategory(name);
  switch (mediaType) {
    case 'video':
      return require('../resource/video_icon.png');
    case 'audio':
      return require('../resource/audio_icon.png');
    case 'txt':
      return require('../resource/txt_icon.png');
    case 'image':
      return require('../resource/image_icon.png');
    case 'zip':
      return require('../resource/zip_icon.png');
    case 'apk':
      return require('../resource/apk_icon.png');
    default:
      return require('../resource/unknown_icon.png');
  }
}

function getPoster(task) {
  if (task.type === TASK_TYPE.BT) return require('../resource/BT_folder_icon.png');
  if (task.type === TASK_TYPE.MAGNET) return require('../resource/link_icon.png');
  return getCommonPoster(task.name);
}


function parseBtSelectSet(data) {
  if (!data) return [];
  try {
    const set = data.split(';');
    set.pop();
    return set.map(index => Number(index));
  } catch (e) {
    return [];
  }
}

function convertTask(item) {
  if (!item) {
    return null;
  }
  const task = new DownloadTask();
  task.id = item._id;
  task.url = item.uri;
  task.path = item._data;
  task.code = Number(item.status);
  task.status = translateStatus(task.code);
  task.name = item.title.trim();
  task.type = Number(item.task_type);
  task.fileSize = Number(item.total_bytes);
  task.speed = Number(item.download_speed); // total speed
  task.duration = Number(item.download_duration);
  task.currentBytes = Number(item.current_bytes);
  const leftBytes = task.fileSize - task.currentBytes;
  task.leftTime = leftBytes > 0 && task.speed > 0 ? leftBytes / task.speed : -1;
  task.poster = getPoster(task);
  task.progress = Number((task.currentBytes / task.fileSize).toFixed(2));
  task.isSpeedUp = item.is_dcdn_speedup === '1';
  task.visible = item.is_visible_in_downloads_ui === '1';
  task.infoHash = item.etag; // capital
  task.isFileExist = item.file_exist === '1';
  task.btSelectedSet = parseBtSelectSet(item.bt_select_set);
  return task;
}

function convertBtSubTask(item) {
  const task = {};
  task.id = item._id;
  task.name = item.title;
  task.index = Number(item.bt_sub_index);
  task.path = item._data;
  task.code = Number(item.status);
  task.status = translateStatus(task.code);
  task.fileSize = Number(item.total_bytes);
  task.speed = Number(item.download_speed);
  task.currentBytes = Number(item.current_bytes);
  task.progress = Number((task.currentBytes / task.fileSize).toFixed(2));
  task.poster = getPoster(task);
  const leftBytes = task.fileSize - task.currentBytes;
  task.leftTime = leftBytes > 0 && task.speed > 0 ? leftBytes / task.speed : -1;
  task.isFileExist = item.file_exist === '1';
  return task;
}

export { isURLSupported, isInfoHash, getCategory, convertTask, convertBtSubTask, getCommonPoster, isMagnet, translateErrorMessage };
