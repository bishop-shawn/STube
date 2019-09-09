export class RuntimeError {
  constructor(message) {
    this.message = message ? message.toString() : 'There must be something wrong';
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

export class DataError extends RuntimeError {
  get name() {
    return 'DataError';
  }
}
