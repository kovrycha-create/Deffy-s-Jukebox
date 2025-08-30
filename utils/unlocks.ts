const UNLOCKS_KEY = 'deffy-jukebox-unlocks';
const SPINNER_COUNT_KEY = 'deffy-jukebox-spinner-count';

interface UnlockState {
  bling: boolean;
}

export const getUnlockState = (): UnlockState => {
  try {
    const unlocksJson = localStorage.getItem(UNLOCKS_KEY);
    const defaultState = { bling: false };
    return unlocksJson ? { ...defaultState, ...JSON.parse(unlocksJson) } : defaultState;
  } catch (e) {
    console.error('Could not load unlock state from local storage', e);
    return { bling: false };
  }
};

export const saveUnlockState = (state: UnlockState): void => {
  try {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Could not save unlock state to local storage', e);
  }
};

export const getSpinCount = (): number => {
    try {
        const count = localStorage.getItem(SPINNER_COUNT_KEY);
        return count ? parseInt(count, 10) : 0;
    } catch (e) {
        return 0;
    }
}

export const saveSpinCount = (count: number): void => {
    try {
        localStorage.setItem(SPINNER_COUNT_KEY, String(count));
    } catch (e) {
        console.error('Could not save spin count to local storage', e);
    }
}