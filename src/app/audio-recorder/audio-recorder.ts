import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioRecorderService } from '../services/audio-recorder';
import { finalize } from 'rxjs/operators';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Header } from "../header/header";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.html',
  styleUrls: ['./audio-recorder.css'],
  standalone: true,
  imports: [CommonModule, Header]
})
export class AudioRecorderComponent implements OnInit, OnDestroy {
  @Output() transcriptionComplete = new EventEmitter<any>();
  @Output() recordingComplete = new EventEmitter<Blob>();
  @Output() recordingError = new EventEmitter<string>();

  isRecording = false;
  isLoading = false;
  isPlaying = false;
  progress = 0;
  error = '';
  audioBlob: Blob | null = null;
  audioDuration = 0;
  recordingTime = 0;
  visualizerBars: number[] = [];

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingTimer: any;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private audioElement: HTMLAudioElement | null = null;
  paramsSubscription: any;

  constructor(private audioRecorderService: AudioRecorderService,   private route: ActivatedRoute,
) {}
workspaceId?: string;
folderId?: string;

  ngOnInit() {
    this.paramsSubscription = this.route.params.subscribe(params => {
    this.workspaceId = params['workspaceId'];
    this.folderId = params['folderId'] || null;
  });
    this.initializeVisualizer();
  }

  ngOnDestroy() {
  this.paramsSubscription.unsubscribe();
  this.cleanup();
}

  private initializeVisualizer() {
    this.visualizerBars = Array(20).fill(0).map(() => Math.random() * 30 + 10);
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

trackByIndex(index: number): number {
  return index;
}
  private async startRecording() {
    try {
      this.error = '';
      this.audioBlob = null;
      this.recordingTime = 0;

      // Use the service method first
      await this.audioRecorderService.startRecording();

      // Request microphone access for visualization
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Setup audio context for visualization
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 64;

      // Setup media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.calculateAudioDuration();
        this.recordingComplete.emit(this.audioBlob);
      };

      // Start recording
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTimer();
      this.startVisualization();

    } catch (err: any) {
      this.error = 'Could not start recording: ' + err.message;
      this.recordingError.emit(this.error);
      console.error('Recording error:', err);
    }
  }

  private stopRecording() {
    this.isLoading = true;

    // Stop the service recording
    this.audioRecorderService.stopRecording()
      .then(audioBlob => {
        // Use the blob from service for transcription
      this.transcribe(audioBlob, this.workspaceId, this.folderId);

        // Also handle our local recording
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      })
      .catch(err => {
        this.error = 'Recording failed: ' + err.message;
        this.isLoading = false;
        console.error('Stop recording error:', err);
      });

    this.isRecording = false;
    this.stopTimer();
    this.stopVisualization();
    this.cleanup();
  }

 private transcribe(audioBlob: Blob, workspaceId?: string, folderId?: string) {
  this.audioRecorderService.transcribeAudio(audioBlob, workspaceId, folderId)
    .pipe(
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / (event.total || 1));
        } else if (event instanceof HttpResponse) {
          this.transcriptionComplete.emit(event.body);
          this.progress = 0;
        }
      },
      error: (err) => {
        this.error = 'Transcription failed: ' + err.message;
        this.recordingError.emit(err.message);
        this.progress = 0;
        console.error('Transcription error:', err);
      }
    });
}
  private startTimer() {
    this.recordingTimer = setInterval(() => {
      this.recordingTime += 1000;
    }, 1000);
  }

  private stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  private startVisualization() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Update visualizer bars based on audio data
      for (let i = 0; i < this.visualizerBars.length; i++) {
        const dataIndex = Math.floor(i * bufferLength / this.visualizerBars.length);
        this.visualizerBars[i] = (dataArray[dataIndex] / 255) * 50 + 5;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  private stopVisualization() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private calculateAudioDuration() {
    if (!this.audioBlob) return;

    const audio = new Audio();
    const url = URL.createObjectURL(this.audioBlob);

    audio.addEventListener('loadedmetadata', () => {
      this.audioDuration = audio.duration * 1000;
      URL.revokeObjectURL(url);
    });

    audio.src = url;
  }

  playRecording() {
    if (!this.audioBlob) return;

    this.audioElement = new Audio();
    const url = URL.createObjectURL(this.audioBlob);
    this.audioElement.src = url;

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.audioElement) {
        URL.revokeObjectURL(this.audioElement.src);
      }
    });

    this.audioElement.play();
    this.isPlaying = true;
  }

  pauseRecording() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  downloadRecording() {
    if (!this.audioBlob) return;

    const url = URL.createObjectURL(this.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  deleteRecording() {
    this.audioBlob = null;
    this.audioDuration = 0;
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  clearError() {
    this.error = '';
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusClass(): string {
    if (this.error) return 'error';
    if (this.isLoading) return 'processing';
    if (this.isRecording) return 'recording';
    if (this.audioBlob) return 'ready';
    return 'idle';
  }

  getStatusIcon(): string {
    if (this.error) return 'fa-exclamation-triangle';
    if (this.isLoading) return 'fa-spinner loading-spinner';
    if (this.isRecording) return 'fa-microphone';
    if (this.audioBlob) return 'fa-check-circle';
    return 'fa-microphone-slash';
  }

  getStatusMessage(): string {
    if (this.error) return 'Recording failed';
    if (this.isLoading) return 'Processing audio...';
    if (this.isRecording) return 'Recording in progress';
    if (this.audioBlob) return 'Recording ready';
    return 'Ready to record';
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    this.analyser = null;
  }


}
