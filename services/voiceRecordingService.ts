/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_VOICE_RECORDING_SERVICE
COLOR_ONION_HEX: NEON=#EF4444 FLUO=#DC2626 PASTEL=#FECACA
ICON_FAMILY: lucide
ICON_GLYPH: mic
ICON_SIG: AL004004
5WH: WHAT=Voice recording and audio capture service; WHY=Voice input and audio processing capabilities; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\services\voiceRecordingService.ts; WHEN=2025-09-22; HOW=TypeScript service with MediaRecorder API
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
// Voice Recording Service for Agent Lee Multi-Tool
// Handles audio recording, processing, and file export

export interface AudioRecordingOptions {
  format: 'wav' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  maxDuration?: number; // in seconds
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}
//#endregion

//#region Init

export class VoiceRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  
  // Event callbacks
  public onStateChange?: (state: RecordingState) => void;
  public onError?: (error: string) => void;
  public onRecordingComplete?: (audioBlob: Blob, duration: number) => void;

  constructor() {
    this.setupAudioContext();
  }
//#endregion

//#region Internals
  private setupAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }
//#endregion

//#region Public API
  // Initialize recording with microphone access
  public async initializeRecording(options: AudioRecordingOptions = { format: 'wav', quality: 'medium' }): Promise<boolean> {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: options.quality === 'high' ? 48000 : options.quality === 'medium' ? 44100 : 22050
        }
      });

      // Setup audio analysis for visual feedback
      if (this.audioContext && this.audioStream) {
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      }

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType(options.format);
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType
      });

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (event) => {
        this.onError?.(`Recording error: ${event}`);
      };

      return true;
    } catch (error) {
      this.onError?.(`Failed to initialize recording: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Start recording
  public startRecording(): boolean {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'recording') {
      return false;
    }

    try {
      this.audioChunks = [];
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.startAudioLevelMonitoring();
      
      this.emitStateChange();
      return true;
    } catch (error) {
      this.onError?.(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Stop recording
  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.stopAudioLevelMonitoring();
    }
  }

  // Pause recording
  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pausedDuration += Date.now() - this.startTime;
      this.emitStateChange();
    }
  }

  // Resume recording
  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.startTime = Date.now();
      this.emitStateChange();
    }
  }

  // Get current recording state
  public getRecordingState(): RecordingState {
    const isRecording = this.mediaRecorder?.state === 'recording';
    const isPaused = this.mediaRecorder?.state === 'paused';
    const duration = this.getCurrentDuration();
    const audioLevel = this.getCurrentAudioLevel();

    return { isRecording, isPaused, duration, audioLevel };
  }
//#endregion

//#region I/O Operations
  // Handle recording completion
  private handleRecordingStop(): void {
    const duration = this.getCurrentDuration();
    const audioBlob = new Blob(this.audioChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/wav' 
    });

    this.onRecordingComplete?.(audioBlob, duration);
    this.emitStateChange();
  }

  // Download recorded audio
  public downloadRecording(audioBlob: Blob, filename?: string, format: 'wav' | 'mp4' = 'wav'): void {
    const defaultFilename = `agent-lee-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
    const finalFilename = filename || defaultFilename;

    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Get supported MIME type for recording
  private getSupportedMimeType(format: 'wav' | 'mp4'): string {
    const types = format === 'mp4' ? [
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm'
    ] : [
      'audio/wav',
      'audio/wave',
      'audio/webm;codecs=pcm',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback
    return 'audio/webm';
  }

  // Audio level monitoring for visual feedback
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!this.analyser || this.mediaRecorder?.state !== 'recording') return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      this.emitStateChange();
      this.animationFrame = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  }

  private stopAudioLevelMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private getCurrentAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    return (sum / bufferLength) / 255; // Normalize to 0-1
  }

  private getCurrentDuration(): number {
    if (!this.startTime) return 0;
    const currentTime = this.mediaRecorder?.state === 'recording' ? Date.now() : this.startTime;
    return Math.floor((currentTime - this.startTime + this.pausedDuration) / 1000);
  }

  private emitStateChange(): void {
    this.onStateChange?.(this.getRecordingState());
  }

  // Clean up resources
  public cleanup(): void {
    this.stopRecording();
    this.stopAudioLevelMonitoring();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
  }

  // Convert audio format (basic implementation)
  public async convertAudioFormat(audioBlob: Blob, targetFormat: 'wav' | 'mp4'): Promise<Blob> {
    // For now, return the original blob with updated type
    // In a full implementation, you'd use a library like ffmpeg.wasm
    const newType = targetFormat === 'wav' ? 'audio/wav' : 'audio/mp4';
    return new Blob([audioBlob], { type: newType });
  }
}

// Create singleton instance
export const voiceRecordingService = new VoiceRecordingService();
//#endregion