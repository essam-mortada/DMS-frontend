import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-upload-document-modal',
  imports: [],
  templateUrl: './upload-document-modal.html',
  styleUrl: './upload-document-modal.css'
})
export class UploadDocumentModal {

  @Input() workspaceId: string | null = null;
  @Input() folderId: string | null = null;
}
