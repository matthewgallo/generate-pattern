import { INLINE } from '../constants.js';

export const successMessage = (type: string) => {
  console.log(
    type === INLINE
      ? `Done, your new inline pattern is ready! ✨`
      : `Done, your new pattern, example app is ready! ✨`
  );
};
