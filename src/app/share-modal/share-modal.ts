import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-modal',
  templateUrl: './share-modal.html',
  styleUrls: ['./share-modal.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ShareModal {
  @Input() showModal = false;
  @Input() shareLink = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() deleteLink = new EventEmitter<void>();

  linkCopied = false;

  copyLink() {
    navigator.clipboard.writeText(this.shareLink).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 2000);
    });
  }

  onDelete() {
    this.deleteLink.emit();
  }

  onClose() {
    this.closeModal.emit();
  }
}
