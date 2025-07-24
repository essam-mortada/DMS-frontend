import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentService } from '../services/document';
import { Document } from '../models/document.model';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-document-preview',
  templateUrl: './document-preview.html',
  styleUrls: ['./document-preview.css']
})
export class DocumentPreview implements OnInit {
  fileUrl: SafeResourceUrl | null = null;
  fileName: string = 'Document Preview';
  fileType: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  supportedTypes = ['image/', 'application/pdf'];
@Output() download = new EventEmitter<Document>();
  @Input() documents: Document[] = [];

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  get documentId(): string {
    return this.route.snapshot.params['documentId'];
  }
  ngOnInit(): void {
    const documentId = this.route.snapshot.params['documentId'];
    this.loadPreview(documentId);
  }

  async loadPreview(documentId: string): Promise<void> {
    try {
      const document = await this.documentService.getMetadata(documentId).toPromise();
      this.fileName = document!.name;
      this.fileType = document!.type || 'application/octet-stream';

      // Then get the file content
      const base64Data = await this.documentService.preview(documentId).toPromise();

      // Create safe URL for preview
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `data:${this.fileType};base64,${base64Data}`
      );

      this.isLoading = false;
    } catch (err) {
      this.error = 'Failed to load document preview';
      this.isLoading = false;
      console.error('Preview error:', err);
    }
  }

isSupportedType(): boolean {
    const supportedTypes = [
      'image/',
      'application/pdf',
      'video/',
      'audio/'
    ];

    return supportedTypes.some(type => this.fileType.startsWith(type));
  }

    getFileTypeDisplay(): string {
    if (this.fileType.startsWith('image/')) return 'Image';
    if (this.fileType === 'application/pdf') return 'PDF';
    if (this.fileType.startsWith('video/')) return 'Video';
    if (this.fileType.startsWith('audio/')) return 'Audio';
    if (this.fileType.includes('word')) return 'Word Document';
    if (this.fileType.includes('excel') || this.fileType.includes('spreadsheet')) return 'Excel';
    if (this.fileType.includes('powerpoint') || this.fileType.includes('presentation')) return 'PowerPoint';
    return 'Document';
  }


     downloadDocument(documentId: string, documentName: string, documentType?: string) {
    if (!documentId) {
      this.snackBar.open('Document ID is missing', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.snackBar.open(`Downloading ${documentName}...`, undefined, { duration: 1500 });
    this.documentService.download(documentId).subscribe({
      next: (blob: Blob) => {
        const extension = this.getExtensionFromMime(documentType || 'application/octet-stream');
        const fileName = `${documentName}.${extension}`;
        this.saveFile(blob, fileName, documentType);
        this.snackBar.open(`${documentName} downloaded successfully`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.snackBar.open(`Failed to download ${documentName}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private saveFile(blob: Blob, fileName: string, mimeType?: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

   private getExtensionFromMime(mimeType: string): string {
    const extensionMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/octet-stream': 'bin',
      'application/json': 'json',
      'application/xml': 'xml',
      'application/javascript': 'js',
      'text/css': 'css',
      'text/html': 'html',
      'text/csv': 'csv',
      'text/markdown': 'md',
      'application/x-www-form-urlencoded': 'url',
      'application/rtf': 'rtf',
      'application/x-shockwave-flash': 'swf',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      'application/x-gzip': 'gz',
      'application/x-bzip2': 'bz2',
      'application/x-iso9660-image': 'iso',
      'application/x-font-ttf': 'ttf',
      'application/x-font-opentype': 'otf',
      'application/x-font-woff': 'woff',
      'application/x-font-woff2': 'woff2',
      'application/x-web-app-manifest+json': 'webapp',
      'application/vnd.apple.installer+xml': 'mpkg',
      'application/vnd.android.package-archive': 'apk',
      'application/x-sh': 'sh',
      'application/x-shellscript': 'sh',
      'application/x-csh': 'csh',
      'application/x-perl': 'pl',
    };
    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }
  goBack(): void {
    this.location.back();
  }

   onDownload(document: Document): void {
      this.download.emit(document);
    }

     retryPreview(): void {
    this.error = '';
    this.isLoading = true;
    // Add retry logic here
    setTimeout(() => {
      this.isLoading = false;
      // Simulate retry result
    }, 2000);
  }
}
