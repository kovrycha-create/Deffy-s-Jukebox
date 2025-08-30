
const LISTENERS_KEY = 'deffy-jukebox-live-listeners';

export const getLiveListeners = (): Record<string, number> => {
    try {
        const listenersJson = sessionStorage.getItem(LISTENERS_KEY);
        return listenersJson ? JSON.parse(listenersJson) : {};
    } catch (e) {
        return {};
    }
};

const saveLiveListeners = (listeners: Record<string, number>): void => {
    try {
        sessionStorage.setItem(LISTENERS_KEY, JSON.stringify(listeners));
    } catch (e) {
        // session storage might be full or unavailable
        console.error("Could not save live listeners to session storage", e);
    }
};

export const updateLiveListeners = (
    allUrls: string[],
    currentListeners: Record<string, number>
): Record<string, number> => {
    const newListeners: Record<string, number> = {};

    allUrls.forEach(url => {
        // Initialize with a random value if not present
        const currentCount = currentListeners[url] ?? Math.floor(Math.random() * 5);
        
        // General fluctuation: tendency to slightly increase
        let change = (Math.random() - 0.45) * 5; 
        let newCount = Math.round(currentCount + change);

        // Random spikes for dynamism
        if (Math.random() < 0.05) { // 5% chance of a small spike up
            newCount += Math.floor(Math.random() * 20);
        }
        if (Math.random() < 0.01) { // 1% chance of a big spike up (new hot song)
            newCount = Math.floor(Math.random() * 150);
        }
        if (Math.random() < 0.05 && newCount > 10) { // 5% chance of a small drop
            newCount -= Math.floor(Math.random() * 10);
        }

        newListeners[url] = Math.max(0, newCount); // Ensure count doesn't go below zero
    });

    saveLiveListeners(newListeners);
    return newListeners;
};
