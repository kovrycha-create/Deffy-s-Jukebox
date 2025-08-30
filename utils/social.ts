
import type { VoteData, Comment, CrowdMarker } from '../types';

const VOTES_KEY = 'deffy-jukebox-votes';
const COMMENTS_KEY = 'deffy-jukebox-comments';
const CROWD_MARKERS_KEY = 'deffy-jukebox-crowd-markers';
const REPORTED_COMMENTS_KEY = 'deffy-jukebox-reported-comments';

// --- VOTES ---

export const getVotes = (): Record<string, VoteData> => {
    try {
        const votesJson = localStorage.getItem(VOTES_KEY);
        const votes = votesJson ? JSON.parse(votesJson) : {};
        // Ensure data structure is correct, migrate old number-based data if needed
        for (const songUrl in votes) {
            if (typeof votes[songUrl].up === 'number' || !votes[songUrl].up) {
                votes[songUrl].up = [];
            }
            if (typeof votes[songUrl].down === 'number' || !votes[songUrl].down) {
                votes[songUrl].down = [];
            }
        }
        return votes;
    } catch (e) {
        console.error('Could not load votes from local storage', e);
        return {};
    }
};

export const saveVotes = (votes: Record<string, VoteData>): void => {
    try {
        localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
    } catch (e) {
        console.error('Could not save votes to local storage', e);
    }
};

export const handleVote = (songUrl: string, voteType: 'up' | 'down'): Record<string, VoteData> => {
    const allVotes = getVotes();
    const songVote = allVotes[songUrl] || { up: [], down: [], userVote: null };
    const now = Date.now();

    // If user is toggling their existing vote off
    if (songVote.userVote === voteType) {
        if (voteType === 'up') songVote.up.pop(); // Assume last one is user's
        if (voteType === 'down') songVote.down.pop();
        songVote.userVote = null;
    } else {
        // If user is changing their vote from the opposite
        if (songVote.userVote === 'up') songVote.up.pop();
        if (songVote.userVote === 'down') songVote.down.pop();

        // Add the new vote
        if (voteType === 'up') songVote.up.push(now);
        if (voteType === 'down') songVote.down.push(now);
        songVote.userVote = voteType;
    }

    allVotes[songUrl] = songVote;
    saveVotes(allVotes);
    return allVotes;
}


// --- COMMENTS ---

export const getComments = (): Record<string, Comment[]> => {
    try {
        const commentsJson = localStorage.getItem(COMMENTS_KEY);
        return commentsJson ? JSON.parse(commentsJson) : {};
    } catch (e) {
        console.error('Could not load comments from local storage', e);
        return {};
    }
};

export const saveComments = (comments: Record<string, Comment[]>): void => {
    try {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
        console.error('Could not save comments to local storage', e);
    }
};

export const addComment = (songUrl: string, newComment: Omit<Comment, 'id' | 'timestamp'>): Record<string, Comment[]> => {
    const allComments = getComments();
    const songComments = allComments[songUrl] || [];
    
    const commentWithId: Comment = {
        ...newComment,
        id: `comment-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
    };

    songComments.unshift(commentWithId); // Add new comments to the top
    allComments[songUrl] = songComments;
    saveComments(allComments);
    return allComments;
};

// --- REPORTED COMMENTS ---

export const getReportedComments = (): Set<string> => {
    try {
        const reportedJson = localStorage.getItem(REPORTED_COMMENTS_KEY);
        return reportedJson ? new Set(JSON.parse(reportedJson)) : new Set();
    } catch (e) {
        console.error('Could not load reported comments', e);
        return new Set();
    }
};

export const reportComment = (commentId: string): Set<string> => {
    const reported = getReportedComments();
    reported.add(commentId);
    try {
        localStorage.setItem(REPORTED_COMMENTS_KEY, JSON.stringify(Array.from(reported)));
    } catch (e) {
        console.error('Could not save reported comments', e);
    }
    return reported;
};


// --- CROWD MARKERS ---

export const getAllCrowdMarkers = (): Record<string, CrowdMarker[]> => {
    try {
        const markersJson = localStorage.getItem(CROWD_MARKERS_KEY);
        return markersJson ? JSON.parse(markersJson) : {};
    } catch (e) {
        console.error('Could not load crowd markers', e);
        return {};
    }
};

export const saveAllCrowdMarkers = (markers: Record<string, CrowdMarker[]>): void => {
    try {
        localStorage.setItem(CROWD_MARKERS_KEY, JSON.stringify(markers));
    } catch (e) {
        console.error('Could not save crowd markers', e);
    }
};

export const addCrowdMarker = (songUrl: string, timestamp: number): Record<string, CrowdMarker[]> => {
    const allMarkers = getAllCrowdMarkers();
    const songMarkers = allMarkers[songUrl] || [];

    // Prevent adding markers too close to each other (e.g., within 3 seconds)
    const lastMarkerTime = songMarkers.length > 0 ? songMarkers[songMarkers.length - 1].timestamp : -Infinity;
    if (timestamp - lastMarkerTime < 3) {
        return allMarkers;
    }

    const newMarker: CrowdMarker = { timestamp };
    songMarkers.push(newMarker);
    songMarkers.sort((a, b) => a.timestamp - b.timestamp); // Keep them sorted
    allMarkers[songUrl] = songMarkers;
    saveAllCrowdMarkers(allMarkers);
    
    return allMarkers;
};

// New function to find clusters of markers and identify "Top Moments"
export const getTopMoments = (markers: CrowdMarker[], songDuration: number): { time: number; count: number }[] => {
    if (!markers || markers.length < 3 || !songDuration) {
        return [];
    }
    
    const CLUSTER_WINDOW_SECONDS = Math.max(5, songDuration * 0.05); // 5 seconds or 5% of song, whichever is larger
    const clusters: { time: number; count: number }[] = [];

    let currentCluster: CrowdMarker[] = [];
    markers.forEach(marker => {
        if (currentCluster.length === 0 || marker.timestamp - currentCluster[0].timestamp <= CLUSTER_WINDOW_SECONDS) {
            currentCluster.push(marker);
        } else {
            if (currentCluster.length > 1) {
                const avgTime = currentCluster.reduce((sum, m) => sum + m.timestamp, 0) / currentCluster.length;
                clusters.push({ time: avgTime, count: currentCluster.length });
            }
            currentCluster = [marker];
        }
    });
    // Add the last cluster if it's valid
    if (currentCluster.length > 1) {
        const avgTime = currentCluster.reduce((sum, m) => sum + m.timestamp, 0) / currentCluster.length;
        clusters.push({ time: avgTime, count: currentCluster.length });
    }

    // Sort by count descending, then by time ascending
    return clusters
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.time - b.time;
        })
        .slice(0, 5); // Return top 5 moments
};