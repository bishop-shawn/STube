// @flow
export default class Video {
  name: string;

  size: number;

  url: string;

  subTaskIndex: number;

  from: String;

  constructor(name: string, size: number, url: string, subTaskIndex: number) {
    this.name = name;
    this.size = size;
    this.url = url;
    this.subTaskIndex = subTaskIndex;
  }
}
