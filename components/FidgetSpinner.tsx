import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import { getSpinCount, saveSpinCount } from '../utils/unlocks';

interface FidgetSpinnerProps {
  song: Song | null;
  isPlaying: boolean;
  spinCount: number;
  onSpinCountChange: (count: number) => void;
  onBlingUnlock: () => void;
  isBlingUnlocked: boolean;
}

const FRICTION = 0.97;
const MIN_VELOCITY = 0.05;
const UNLOCK_THRESHOLD = 100;

const FidgetSpinner: React.FC<FidgetSpinnerProps> = ({ song, isPlaying, spinCount, onSpinCountChange, onBlingUnlock, isBlingUnlocked }) => {
  const [rotation, setRotation] = useState(0);
  const [isLockedSpin, setIsLockedSpin] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);

  const spinnerRef = useRef<HTMLDivElement>(null);
  const velocity = useRef(0);
  const isDragging = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const animationFrame = useRef<number | null>(null);

  const totalRotation = useRef(getSpinCount() * 360);
  const lastNotifiedSpins = useRef(getSpinCount());
  
  const checkSpins = useCallback(() => {
    const currentSpins = Math.floor(Math.abs(totalRotation.current) / 360);
    if (currentSpins > lastNotifiedSpins.current) {
        lastNotifiedSpins.current = currentSpins;
        onSpinCountChange(currentSpins);
        saveSpinCount(currentSpins);

        if (!isBlingUnlocked && currentSpins >= UNLOCK_THRESHOLD) {
            onBlingUnlock();
        }
    }
  }, [isBlingUnlocked, onSpinCountChange, onBlingUnlock]);

  const addRotation = useCallback((degrees: number) => {
    totalRotation.current += degrees;
    setRotation(r => r + degrees);
    checkSpins();
  }, [checkSpins]);

  const spinAnimation = useCallback(() => {
    if (!isDragging.current && Math.abs(velocity.current) < MIN_VELOCITY) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    velocity.current *= FRICTION;
    addRotation(velocity.current);

    animationFrame.current = requestAnimationFrame(spinAnimation);
  }, [addRotation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !lastMousePos.current || !spinnerRef.current) return;
    
    e.preventDefault();

    const spinnerRect = spinnerRef.current.getBoundingClientRect();
    const centerX = spinnerRect.left + spinnerRect.width / 2;
    const centerY = spinnerRect.top + spinnerRect.height / 2;

    const angleNow = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleLast = Math.atan2(lastMousePos.current.y - centerY, lastMousePos.current.x - centerX);
    let angleDelta = angleNow - angleLast;
    
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

    const degreesDelta = angleDelta * (180 / Math.PI);
    velocity.current = degreesDelta;
    addRotation(degreesDelta);

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [addRotation]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastMousePos.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    if (Math.abs(velocity.current) > MIN_VELOCITY) {
        if (!animationFrame.current) {
          animationFrame.current = requestAnimationFrame(spinAnimation);
        }
    }
  }, [handleMouseMove, spinAnimation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsLockedSpin(false);
    setIsAutonomous(false);

    if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
    }
    isDragging.current = true;
    velocity.current = 0;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);
  
  const handleCenterMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLockedSpin || isAutonomous) {
      setIsLockedSpin(false);
      setIsAutonomous(false);
      return;
    }

    if (e.ctrlKey && e.shiftKey && e.altKey) {
      setIsAutonomous(true);
      return;
    }

    if (e.ctrlKey) {
      setIsLockedSpin(true);
      return;
    }
    
    velocity.current += 20;
    if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(spinAnimation);
    }
  };

  useEffect(() => {
    let frameId: number;
    const lockedSpinLoop = () => {
        addRotation(5);
        frameId = requestAnimationFrame(lockedSpinLoop);
    };
    if (isLockedSpin) {
        frameId = requestAnimationFrame(lockedSpinLoop);
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isLockedSpin, addRotation]);

  useEffect(() => {
    if (!isAutonomous) return;

    let autonomousInterval: number;

    const startAutonomousBehavior = () => {
        if (isPlaying && song?.bpm && song.bpm > 0) {
            const beatInterval = (60 / song.bpm) * 1000;
            autonomousInterval = window.setInterval(() => {
                velocity.current += 10 + Math.random() * 10;
                if (!animationFrame.current) {
                    animationFrame.current = requestAnimationFrame(spinAnimation);
                }
            }, beatInterval);
        } else {
            const randomSpin = () => {
                velocity.current = (Math.random() - 0.5) * 50;
                if (!animationFrame.current) {
                    animationFrame.current = requestAnimationFrame(spinAnimation);
                }
                const randomDelay = 1000 + Math.random() * 2000;
                autonomousInterval = window.setTimeout(randomSpin, randomDelay);
            };
            randomSpin();
        }
    };

    startAutonomousBehavior();

    return () => {
        clearInterval(autonomousInterval);
        clearTimeout(autonomousInterval);
    };
  }, [isAutonomous, isPlaying, song, spinAnimation]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={spinnerRef}
      className="fidget-spinner"
      onMouseDown={handleMouseDown}
      style={{ transform: `rotate(${rotation}deg)` }}
      role="button"
      aria-label="Interactive Fidget Spinner"
    >
      <div className="spinner-arm" style={{ transform: 'translateX(-50%) rotate(0deg)' }}></div>
      <div className="spinner-arm" style={{ transform: 'translateX(-50%) rotate(120deg)' }}></div>
      <div className="spinner-arm" style={{ transform: 'translateX(-50%) rotate(240deg)' }}></div>
      <div className="spinner-center cursor-pointer" onMouseDown={handleCenterMouseDown}></div>
    </div>
  );
};

export default FidgetSpinner;