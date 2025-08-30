const TUTORIAL_KEY = 'deffy-jukebox-tutorial-seen';

export const hasSeenTutorial = (): boolean => {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export const setHasSeenTutorial = (): void => {
  try {
    localStorage.setItem(TUTORIAL_KEY, 'true');
  } catch (e) {
    console.error('Could not save tutorial state', e);
  }
};
