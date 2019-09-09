import createIconSet from 'react-native-vector-icons/lib/create-icon-set';
import glyphMap from './iconfont.json';

// glyphMap, fontFamily, fontFile three arguments，look for react-native-vector-icons document，
// fontFamily can be any string in android，but must be right name in IOS，iOS can dblclick iconfont.ttf for the right name.
const iconSet = createIconSet(glyphMap, 'iconFont', 'iconfont.ttf');

export default iconSet;

export const { Button } = iconSet;
export const { TabBarItem } = iconSet;
export const { TabBarItemIOS } = iconSet;
export const { ToolbarAndroid } = iconSet;
export const { getImageSource } = iconSet;
