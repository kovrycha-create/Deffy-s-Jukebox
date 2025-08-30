import React, { useRef, useEffect, useCallback } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  type?: 'bars' | 'circle' | 'waveform';
}

const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, color: string) => {
    const bufferLength = dataArray.length;
    const barWidth = width / bufferLength;
    let x = 0;
    
    ctx.fillStyle = color;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth;
    }
}

const drawCircle = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, color: string) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const minSize = Math.min(width, height);
    const radius = minSize / 5;
    const barCount = dataArray.length;
    
    for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i] / 255) * (radius * 0.8);
        const angle = (i / (barCount / 2)) * Math.PI;

        const x1 = centerX + radius * Math.cos(angle);
        const y1 = centerY + radius * Math.sin(angle);
        const x2 = centerX + (radius + barHeight) * Math.cos(angle);
        const y2 = centerY + (radius + barHeight) * Math.sin(angle);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = minSize / 150;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

const drawWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, color: string) => {
    const bufferLength = dataArray.length;
    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (height / 2);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    
    ctx.lineTo(width, height / 2);
    ctx.stroke();
};


const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, isPlaying, type = 'bars' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  useEffect(() => {
    if (analyserNode) {
        dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }
  }, [analyserNode]);

  const draw = useCallback(() => {
    if (!analyserNode || !dataArrayRef.current || !canvasRef.current) {
      animationFrameId.current = requestAnimationFrame(draw);
      return;
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const style = getComputedStyle(document.documentElement);
    const accentColor = style.getPropertyValue('--accent-hover-color').trim() || '#60a5fa';

    switch(type) {
        case 'circle':
            analyserNode.getByteFrequencyData(dataArrayRef.current);
            drawCircle(ctx, dataArrayRef.current, width, height, accentColor);
            break;
        case 'waveform':
            analyserNode.getByteTimeDomainData(dataArrayRef.current);
            drawWaveform(ctx, dataArrayRef.current, width, height, accentColor);
            break;
        case 'bars':
        default:
            analyserNode.getByteFrequencyData(dataArrayRef.current);
            drawBars(ctx, dataArrayRef.current, width, height, accentColor);
            break;
    }

    animationFrameId.current = requestAnimationFrame(draw);
  }, [type, analyserNode]);

  useEffect(() => {
    if (isPlaying && analyserNode) {
      if (animationFrameId.current === null) {
        animationFrameId.current = requestAnimationFrame(draw);
      }
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, draw, analyserNode]);
  
  useEffect(() => {
    const handleResize = () => {
        if(canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full transition-opacity duration-500" style={{ opacity: isPlaying ? 1 : 0 }}/>;
};

export default Visualizer;