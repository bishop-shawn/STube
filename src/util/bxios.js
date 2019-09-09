import ProxySDK from '../sdk/proxySDK';

class Bxios {
  request(config) {
    if (typeof config[0] === 'string') {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    if (!config.method) {
      config.method = 'get';
    }

    const obj = {
      method: config.method,
      headers: this.getStrOfHeader(config.headers),
      body: config.data,
    };
    const seperatorIndex = config.url.indexOf('/');
    const host = config.url.substring(0, seperatorIndex);
    const path = config.url.substring(seperatorIndex);
    const isConcurrent = config.isConcurrent !== undefined ? config.isConcurrent : false;
    return ProxySDK.request(host, obj.method, path, obj.headers, obj.body, config.timeout / 1000, isConcurrent).then(res => {
      let data = '';
      try {
        data = JSON.parse(res.body);
      } catch (e) {
        data = res.body;
      }
      return { data };
    });
  }

  get(url, config) {
    config.url = url;
    config.method = 'get';
    return this.request(config);
  }

  post(url, data, config) {
    config.url = url;
    config.method = 'post';
    config.data = data;
    return this.request(config);
  }

  put(url, data, config) {
    config.url = url;
    config.method = 'put';
    config.data = data;
    return this.request(config);
  }

  delete(url, config) {
    config.url = url;
    config.method = 'delete';
    return this.request(config);
  }

  getStrOfHeader(obj) {
    let str = '';
    Object.keys(obj).forEach(prop => {
      str += `${prop}: ${obj[prop]}\r\n`;
    });
    return str.trim();
  }
}

const context = new Bxios();
const instance = context.request.bind(context);
['get', 'post', 'put', 'delete'].forEach(method => {
  instance[method] = context[method].bind(context);
});

export default instance;
