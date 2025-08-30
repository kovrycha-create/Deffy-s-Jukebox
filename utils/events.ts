
import type { SocialEvent, SocialEventType } from '../types';

const EVENTS_KEY = 'deffy-jukebox-social-events';
const MAX_EVENTS = 2000; // Limit to prevent excessive storage usage

export const getSocialEvents = (): SocialEvent[] => {
  try {
    const eventsJson = localStorage.getItem(EVENTS_KEY);
    return eventsJson ? JSON.parse(eventsJson) : [];
  } catch (e) {
    console.error('Could not load social events from local storage', e);
    return [];
  }
};

export const logSocialEvent = (type: SocialEventType, url: string): void => {
  try {
    let events = getSocialEvents();
    
    const newEvent: SocialEvent = {
      type,
      url,
      timestamp: Date.now(),
    };

    events.push(newEvent);

    // Trim old events if the log gets too large
    if (events.length > MAX_EVENTS) {
      events = events.slice(events.length - MAX_EVENTS);
    }

    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Could not save social event to local storage', e);
  }
};
