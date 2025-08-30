import React, { useState, useEffect, useLayoutEffect } from 'react';

interface TutorialStep {
    readonly selector?: string;
    readonly title: string;
    readonly content: string;
    readonly position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialProps {
    readonly steps: readonly TutorialStep[];
    stepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ steps, stepIndex, onNext, onPrev, onClose }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const step = steps[stepIndex];

    useLayoutEffect(() => {
        if (step.selector) {
            const element = document.querySelector(step.selector) as HTMLElement;
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                // Give it a moment to scroll
                setTimeout(() => {
                    setTargetRect(element.getBoundingClientRect());
                }, 300); 
            } else {
                 setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [step.selector, stepIndex]);
    
    const tooltipStyle: React.CSSProperties = {};
    if (targetRect) {
        switch (step.position) {
            case 'bottom':
                tooltipStyle.top = `${targetRect.bottom + 16}px`;
                tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
                tooltipStyle.transform = 'translateX(-50%)';
                break;
            case 'top':
                tooltipStyle.top = `${targetRect.top - 16}px`;
                tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
                tooltipStyle.transform = 'translate(-50%, -100%)';
                break;
            case 'right':
                tooltipStyle.left = `${targetRect.right + 16}px`;
                tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
                tooltipStyle.transform = 'translateY(-50%)';
                break;
            case 'left':
                tooltipStyle.left = `${targetRect.left - 16}px`;
                tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
                tooltipStyle.transform = 'translate(-100%, -50%)';
                break;
        }
    }

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Highlight box */}
            {targetRect && (
                <>
                <div className="fixed inset-0 bg-black/70 transition-opacity duration-300" onClick={onClose} />
                <div
                    className="fixed pointer-events-none transition-all duration-300"
                    style={{
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                        borderRadius: '8px',
                    }}
                />
                </>
            )}

            {/* Tooltip / Modal */}
            {step.position === 'center' ? (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-[var(--surface-color)] text-center text-[var(--text-primary)] rounded-lg shadow-2xl p-8 max-w-md w-full animate-fade-in-sm">
                        <h2 className="text-2xl font-bold text-[var(--accent-highlight)] mb-4">{step.title}</h2>
                        <p className="text-[var(--text-secondary)] mb-6">{step.content}</p>
                        <div className="flex items-center justify-center gap-4">
                             <button onClick={onClose} className="px-5 py-2 rounded-lg font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-colors">
                                Skip Tour
                             </button>
                             <button onClick={onNext} className="px-5 py-2 rounded-lg font-semibold bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover-color)] transition-colors">
                                Start Tour
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="fixed bg-[var(--surface-color)] text-[var(--text-primary)] rounded-lg shadow-2xl p-4 max-w-xs w-full transition-all duration-300 animate-fade-in-sm"
                    style={tooltipStyle}
                >
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">{step.content}</p>
                    <div className="flex items-center justify-between">
                        <button onClick={onClose} className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">Skip</button>
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-[var(--text-muted)]">{stepIndex}/{steps.length - 1}</span>
                             {stepIndex > 0 && (
                                <button onClick={onPrev} className="px-3 py-1 text-sm rounded-md font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-colors">Prev</button>
                             )}
                             <button onClick={onNext} className="px-4 py-1.5 text-sm rounded-md font-semibold bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover-color)] transition-colors">
                               {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tutorial;
