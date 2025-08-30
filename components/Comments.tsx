
import React, { useState, useMemo } from 'react';
import type { Comment } from '../types';
import { formatTime } from '../utils/parser';
import CommentTextRenderer from './CommentTextRenderer';
import { FlagIcon } from './Icons';

interface CommentsProps {
  songUrl: string;
  comments: Comment[];
  currentTime: number;
  onAddComment: (songUrl: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onSeek: (time: number) => void;
  reportedComments: Set<string>;
  onReportComment: (commentId: string) => void;
}

type SortType = 'newest' | 'timestamp';

const timeAgo = (timestamp: number) => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const Comments: React.FC<CommentsProps> = ({ songUrl, comments, currentTime, onAddComment, onSeek, reportedComments, onReportComment }) => {
  const [newComment, setNewComment] = useState('');
  const [attachTime, setAttachTime] = useState(true);
  const [sort, setSort] = useState<SortType>('newest');
  const [reportingId, setReportingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(songUrl, {
        user: "You", // Static user for local-only version
        avatar: "", // No avatar for now
        text: newComment.trim(),
        songTimestamp: attachTime ? currentTime : undefined,
      });
      setNewComment('');
    }
  };

  const handleReport = (commentId: string) => {
    onReportComment(commentId);
    setReportingId(null);
  };

  const sortedComments = useMemo(() => {
    const commentsCopy = [...comments];
    if (sort === 'newest') {
      return commentsCopy.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (sort === 'timestamp') {
      return commentsCopy.sort((a, b) => (a.songTimestamp ?? Infinity) - (b.songTimestamp ?? Infinity));
    }
    return commentsCopy;
  }, [comments, sort]);

  const visibleComments = useMemo(() => {
    return sortedComments.filter(comment => !reportedComments.has(comment.id));
  }, [sortedComments, reportedComments]);


  return (
    <div className="w-full h-full flex flex-col text-left">
      <div className="flex-shrink-0 flex items-center justify-end gap-2 mb-2">
        <span className="text-xs font-semibold text-white/60">Sort by:</span>
        <button onClick={() => setSort('newest')} className={`px-2 py-0.5 text-xs rounded ${sort === 'newest' ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}>Newest</button>
        <button onClick={() => setSort('timestamp')} className={`px-2 py-0.5 text-xs rounded ${sort === 'timestamp' ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}>Timestamp</button>
      </div>
      <div className="flex-grow overflow-y-auto pr-4">
        {visibleComments.length > 0 ? (
          <ul>
            {visibleComments.map((comment) => (
              <li key={comment.id} className="comment-item group">
                <div className="comment-avatar"></div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-user">{comment.user}</span>
                    <span className="comment-timestamp">{timeAgo(comment.timestamp)}</span>
                    {comment.songTimestamp !== undefined && sort !== 'timestamp' && (
                      <button onClick={() => onSeek(comment.songTimestamp!)} className="comment-song-timestamp">
                        @{formatTime(comment.songTimestamp)}
                      </button>
                    )}
                  </div>
                  {reportingId === comment.id ? (
                    <div className="bg-red-500/10 p-2 rounded-md my-1 text-sm">
                        <p className="font-semibold text-red-300">Report this comment?</p>
                        <p className="text-xs text-red-300/80 mb-2">This will hide it from your view.</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleReport(comment.id)} className="px-2 py-0.5 text-xs bg-red-500/50 hover:bg-red-500/80 rounded">Confirm</button>
                            <button onClick={() => setReportingId(null)} className="px-2 py-0.5 text-xs hover:bg-white/10 rounded">Cancel</button>
                        </div>
                    </div>
                  ) : (
                    <p className="comment-text">
                        <CommentTextRenderer text={comment.text} onSeek={onSeek} />
                    </p>
                  )}
                </div>
                <button onClick={() => setReportingId(comment.id)} className="p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/50 hover:text-red-400 transition-opacity" aria-label="Report comment">
                    <FlagIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-white/50">
            <div>
              <p className="font-bold">No comments yet.</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex-shrink-0 pt-4 comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... timestamps like 1:23 become clickable!"
          className="comment-textarea"
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70">
            <input type="checkbox" checked={attachTime} onChange={(e) => setAttachTime(e.target.checked)} className="accent-[var(--accent-color)]" />
            Attach time ({formatTime(currentTime)})
          </label>
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-1.5 text-sm rounded-md font-semibold bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover-color)] transition-colors disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      </form>
    </div>
  );
};

export default Comments;