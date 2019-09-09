// @flow
export default class DownloadTask {
  id: string;

  url: string;

  path: string;

  code: number;

  status: number;

  name: string;

  type: number;

  fileSize: number;

  speed: number;

  duration: number;

  currentBytes: number;

  leftTime: number;

  poster: Object;

  progress: number;

  isSpeedUp: boolean;

  visible: boolean;

  infoHash: string;

  isFileExist: boolean;

  btSelectedSet: number[];
}
