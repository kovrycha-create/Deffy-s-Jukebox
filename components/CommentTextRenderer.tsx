
import React from 'react';

interface CommentTextRendererProps {
  text: string;
  onSeek: (time: number) => void;
}

const CommentTextRenderer: React.FC<CommentTextRendererProps> = ({ text, onSeek }) => {
  const timestampRegex = /(\d{1,2}):(\d{2})/g;
  const parts = text.split(timestampRegex);

  return (
    <>
      {parts.map((part, index) => {
        if ((index - 1) % 3 === 0) {
          const minutes = parseInt(parts[index], 10);
          const seconds = parseInt(parts[index + 1], 10);
          const timeInSeconds = minutes * 60 + seconds;
          return (
            <button
              key={index}
              onClick={() => onSeek(timeInSeconds)}
              className="comment-song-timestamp"
            >
              {minutes}:{parts[index+1]}
            </button>
          );
        }
        if (index % 3 === 0) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }
        return null;
      })}
    </>
  );
};

export default CommentTextRenderer;