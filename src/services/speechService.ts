/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectSpeechFromLevel, normalizeAudioLevel } from '../utils/voiceActivity';

export interface RecordingResult {
  audioBase64: string;
  speechDetected: boolean;
  maxLevel: number;
}

export class SpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private levelMonitorTimer: number | null = null;
  private maxLevel = 0;

  public async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];
    this.maxLevel = 0;

    this.audioContext = new AudioContext();
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.mediaStreamSource.connect(this.analyser);

    const samples = new Uint8Array(this.analyser.fftSize);
    this.levelMonitorTimer = window.setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(samples);
      this.maxLevel = Math.max(this.maxLevel, normalizeAudioLevel(samples));
    }, 80);

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }

  public async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        return resolve({ audioBase64: '', speechDetected: false, maxLevel: 0 });
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve({
            audioBase64: base64String,
            speechDetected: detectSpeechFromLevel(this.maxLevel),
            maxLevel: this.maxLevel,
          });
        };

        if (this.levelMonitorTimer !== null) {
          window.clearInterval(this.levelMonitorTimer);
          this.levelMonitorTimer = null;
        }
        this.mediaStreamSource?.disconnect();
        this.analyser?.disconnect();
        void this.audioContext?.close();
        this.mediaStreamSource = null;
        this.analyser = null;
        this.audioContext = null;

        // Stop all tracks to release the microphone
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.stop();
    });
  }
}

export const speechService = new SpeechService();
