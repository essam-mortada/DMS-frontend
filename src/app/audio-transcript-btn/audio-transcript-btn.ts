import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-transcript-button',
  templateUrl: './audio-transcript-btn.html',
  styleUrls: ['./audio-transcript-btn.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AudioTranscriptButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'minimal' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() showIcon: boolean = true;
  @Input() showText: boolean = true;
  @Input() text: string = 'Audio Transcript';
  //@Input() routerLink: string = '';
  @Input() tooltip: string = 'Start audio recording and transcription';
  @Input() badge: number | null = null;
  @Input() pulse: boolean = false;
  @Input() showWaves: boolean = false;
  @Input() folderId:string = '';
  @Input() workspaceId:string = '';

  @Output() clicked = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      return;
    }

    this.clicked.emit();

    // if (this.routerLink) {
    //   this.router.navigate([this.routerLink]);
    // }
  }

  getButtonClasses(): string {
    const classes = ['audio-transcript-btn'];

    classes.push(`variant-${this.variant}`);
    classes.push(`size-${this.size}`);

    if (this.disabled) classes.push('disabled');
    if (this.loading) classes.push('loading');
    if (this.pulse) classes.push('pulse');
    if (!this.showText) classes.push('icon-only');
    if (this.showWaves) classes.push('show-waves');

    return classes.join(' ');
  }
}
