import { Component, type OnInit, type OnDestroy, ViewChild, type ElementRef } from "@angular/core"
import {  ActivatedRoute, Router, RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import  { SharingService } from "../services/sharing"
import  { Document as DmsDocument } from "../models/document.model"
import  { Folder } from "../models/folder.model"
import  { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import  { DocumentService } from "../services/document"
import  { MatSnackBar } from "@angular/material/snack-bar"
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle";

@Component({
  selector: "app-public-share",
  templateUrl: "./public-share.html",
  styleUrls: ["./public-share.css"],
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, RouterModule],
})
export class PublicShareComponent implements OnInit, OnDestroy {
  @ViewChild("previewContainer") previewContainer!: ElementRef

  sharedItem: DmsDocument | Folder | null = null
  loading = true
  error: string | null = null
  previewUrl: SafeResourceUrl | null = null
  objectUrl: string | null = null
  previewSupported = false
  downloading = false
  textContent = ""

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharingService: SharingService,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get("token")
    if (!token) {
      this.error = "No share token provided."
      this.loading = false
      return
    }

    this.sharingService.getSharedItem(token).subscribe({
      next: (item) => {
        this.sharedItem = item
        if (this.isDocument(item)) {
          this.previewSupported = this.isPreviewSupported(item.type)
          if (this.previewSupported) {
            this.loadDocumentPreview(token, item)
          } else {
            this.loading = false
          }
        } else {
          this.loading = false
        }
      },
      error: (err) => {
        this.error = "The shared link is invalid or has expired."
        this.loading = false
      },
    })
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
    }
  }

  isDocument(item: DmsDocument | Folder | null): item is DmsDocument {
    return item !== null && "type" in item
  }

  loadDocumentPreview(token: string, document: DmsDocument): void {
    this.documentService.publicPreview(token).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob)

        // Handle different preview types
        if (
          this.isImageType(document) ||
          this.isPdfType(document) ||
          this.isVideoType(document) ||
          this.isAudioType(document)
        ) {
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl)
        }

        // For text files, read the content
        if (this.isTextType(document)) {
          this.loadTextContent(blob)
        }

        this.loading = false
      },
      error: (err) => {
        console.error("Preview error:", err)
        this.error = "Could not load document preview."
        this.loading = false
      },
    })
  }

  private loadTextContent(blob: Blob): void {
    const reader = new FileReader()
    reader.onload = (e) => {
      this.textContent = e.target?.result as string
    }
    reader.readAsText(blob)
  }

  // File type checking methods
  isImageType(item: DmsDocument): boolean {
    return item?.type?.startsWith("image/") || false
  }

  isPdfType(item: DmsDocument): boolean {
    return item?.type === "application/pdf"
  }

  isVideoType(item: DmsDocument): boolean {
    return item?.type?.startsWith("video/") || false
  }

  isAudioType(item: DmsDocument): boolean {
    return item?.type?.startsWith("audio/") || false
  }

  isTextType(item: DmsDocument): boolean {
    return (
      item?.type?.startsWith("text/") ||
      item?.type === "application/json" ||
      item?.name?.endsWith(".js") ||
      item?.name?.endsWith(".ts") ||
      item?.name?.endsWith(".css") ||
      item?.name?.endsWith(".html") ||
      item?.name?.endsWith(".xml") ||
      item?.name?.endsWith(".md") ||
      false
    )
  }

  isPreviewSupported(type: string): boolean {
    const mockDoc = { type } as DmsDocument
    return (
      this.isImageType(mockDoc) ||
      this.isPdfType(mockDoc) ||
      this.isVideoType(mockDoc) ||
      this.isAudioType(mockDoc) ||
      this.isTextType(mockDoc)
    )
  }

  // Icon and display methods for template
  getFileIcon(item: DmsDocument): string {
    if (this.isImageType(item)) return "fa-file-image"
    if (this.isPdfType(item)) return "fa-file-pdf"
    if (this.isVideoType(item)) return "fa-file-video"
    if (this.isAudioType(item)) return "fa-file-audio"
    if (this.isTextType(item)) return "fa-file-code"
    if (item.type?.includes("word")) return "fa-file-word"
    if (item.type?.includes("excel")) return "fa-file-excel"
    if (item.type?.includes("powerpoint")) return "fa-file-powerpoint"
    return "fa-file-alt"
  }

  getFileIconClass(item: DmsDocument): string {
    if (this.isImageType(item)) return "image"
    if (this.isPdfType(item)) return "pdf"
    if (item.type?.includes("word")) return "word"
    if (item.type?.includes("excel")) return "excel"
    return "default"
  }

  getFileTypeDisplay(item: DmsDocument): string {
    if (this.isImageType(item)) return "Image"
    if (this.isPdfType(item)) return "PDF"
    if (this.isVideoType(item)) return "Video"
    if (this.isAudioType(item)) return "Audio"
    if (this.isTextType(item)) return "Text"
    if (item.type?.includes("word")) return "Word Document"
    if (item.type?.includes("excel")) return "Excel Spreadsheet"
    if (item.type?.includes("powerpoint")) return "PowerPoint"
    return "Document"
  }

  getFileTypeBadgeClass(item: DmsDocument): string {
    if (this.isImageType(item)) return "badge-image"
    if (this.isPdfType(item)) return "badge-pdf"
    if (item.type?.includes("word")) return "badge-word"
    if (item.type?.includes("excel")) return "badge-excel"
    return "badge-default"
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  downloadDocument(document: DmsDocument): void {
    const token = this.route.snapshot.paramMap.get("token")
    if (!token) return

    this.downloading = true
    this.snackBar.open(`Downloading ${document.name}...`, undefined, { duration: 2000 })

    this.documentService.publicDownload(token).subscribe({
      next: (blob) => {
        const a = window.document.createElement("a")
        const objectUrl = URL.createObjectURL(blob)
        a.href = objectUrl
        a.download = document.name
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)

        this.downloading = false
        this.snackBar.open("Download complete!", "Close", { duration: 3000 })
      },
      error: (err) => {
        this.downloading = false
        this.snackBar.open("Download failed.", "Close", {
          duration: 5000,
          panelClass: ["error-snackbar"],
        })
      },
    })
  }

  // New methods for enhanced functionality
  toggleFullscreen(): void {
    if (this.previewContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        this.previewContainer.nativeElement.requestFullscreen().catch((err: any) => {
          console.error("Error attempting to enable fullscreen:", err)
        })
      }
    }
  }

  onImageLoad(): void {
    console.log("Image loaded successfully")
  }

  onImageError(): void {
    console.error("Failed to load image")
    this.error = "Failed to load image preview"
  }

  onPdfLoad(): void {
    console.log("PDF loaded successfully")
  }

  onPdfError(): void {
    console.error("Failed to load PDF")
    this.error = "Failed to load PDF preview"
  }
}
