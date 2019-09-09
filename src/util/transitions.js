const none = () => {};

const horizontalSlip = (index, position) => {
  const inputRange = [index - 1, index, index + 1];

  const opacity = position.interpolate({
    inputRange,
    outputRange: [1, 1, 1],
  });

  const translateX = position.interpolate({
    inputRange,
    outputRange: [600, 0, 0],
  });
  const translateY = 0;

  return {
    opacity,
    transform: [{ translateX }, { translateY }],
  };
};

export const transitionTypes = {
  horizontalSlip: 'horizontalSlip',
  none: 'none',
};

export default function (type) {
  switch (type) {
    case transitionTypes.none:
      return none;
    case transitionTypes.horizontalSlip:
      return horizontalSlip;
    default:
      return horizontalSlip;
  }
}
