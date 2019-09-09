import bxios from '../util/bxios';

const host = 'cdb1b041856704d6e8325eb52a76f4cb';
let tags = [];

const getTags = async () => {
  if (tags && tags.length > 0) return tags;
  try {
    const url = `${host}/hotwords.json`;
    console.log('REQUEST url:', url);
    const { data } = await bxios({
      url,
      headers: {
        Host: 'ypoe.oineve.com',
      },
      timeout: 15000,
    });
    console.log('REQUEST response: ', JSON.stringify(data));
    tags = data.data && data.data.words ? data.data.words : [];
    return tags;
  } catch (e) {
    return [];
  }
};

export default {
  getTags,
};
