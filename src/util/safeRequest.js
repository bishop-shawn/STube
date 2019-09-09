import request from './request';
global.calledCheckin = false;

const _checkin = async () => {
  if(global.calledCheckin) {
    return;
  } else {
    const result = await request.post('device/checkin');
    global.calledCheckin = true;
    return result;
  }
}

export default {
  get: async (...args) => {
    await _checkin();
    return await request.get(...args);
  },
  post: async (...args) => {
    await _checkin();
    return await request.post(...args);
  }
}
