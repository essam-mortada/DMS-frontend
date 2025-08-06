import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  private recording = false;

  constructor(private http: HttpClient) {}

  startRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.audioChunks = [];

          this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
          };

          this.mediaRecorder.start();
          this.recording = true;
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
        this.cleanup();
      };

      this.mediaRecorder.stop();
      this.recording = false;
    });
  }

  isRecording(): boolean {
    return this.recording;
  }

  private cleanup() {
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }

 transcribeAudio(audioBlob: Blob, workspaceId?: string, folderId?: string): Observable<any> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  if (workspaceId) {
    formData.append('workspaceId', workspaceId);
  }
  if (folderId) {
    formData.append('folderId', folderId);
  }

  return this.http.post('http://localhost:8081/api/documents/transcribe', formData, {
    reportProgress: true,
    observe: 'events'
  });
}
}
