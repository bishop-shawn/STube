// @flow
export default class BTFileInfo {
  name: string;

  size: number;

  index: number;

  constructor(name: string, size: number, index: number) {
    this.name = name;
    this.size = size || 0;
    this.index = index;
  }
}
