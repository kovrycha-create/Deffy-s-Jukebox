let audioContext: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;

export const getVisualizerNodes = (audioElement: HTMLAudioElement) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // This check is crucial: createMediaElementSource can only be called ONCE per element.
    if (!sourceNode || sourceNode.mediaElement !== audioElement) {
      // If we have an old source, disconnect it.
      if (sourceNode) {
        sourceNode.disconnect();
      }
      sourceNode = audioContext.createMediaElementSource(audioElement);
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 128; // Fewer bars for a cleaner look
      
      // Build the audio graph
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
    }
    
    // Ensure context is running, as it can be suspended by the browser
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    return { audioContext, analyserNode };
  } catch (e) {
    // Catch errors, commonly CORS issues if audio is from another domain without proper headers
    console.error("Error setting up audio context for visualizer. This may be due to CORS policy.", e);
    return { audioContext: null, analyserNode: null };
  }
};
