import { Component, Input, Output, EventEmitter, type OnInit, type OnDestroy, inject, Inject, OnChanges, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Subscription } from "rxjs"
import { DocumentService } from "../services/document"
import type { Document as DmsDocument } from "../models/document.model"

@Component({
  selector: "app-document-summary-modal",
  templateUrl: "./document-summary-modal.html",
  styleUrls: ["./document-summary-modal.css"],
  imports: [CommonModule],
})
export class DocumentSummaryModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() document: DmsDocument | null = null
  @Input() showModal = false
  @Output() closeModal = new EventEmitter<void>()

  summaryText = ""
  loading = false
  error = ""

  private subscription: Subscription = new Subscription()

  constructor(    @Inject(DocumentService) private documentService: DocumentService
) {}

  ngOnInit(): void {
      this.summarizeDocument()
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showModal']?.currentValue === true) {
      this.summarizeDocument()
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  summarizeDocument(): void {
    if (!this.document?.id) return

    this.loading = true
    this.error = ""
    this.summaryText = ""

    this.subscription.add(
      this.documentService.summarizeDocument(this.document.id).subscribe({
        next: (res) => {
          this.summaryText = res
          this.loading = false
        },
        error: (err) => {
          this.error = "Error summarizing document. Please try again."
          this.loading = false
          console.error(err)
        },
      }),
    )
  }

  close(): void {
    this.closeModal.emit()
  }

  retrySummary(): void {
    this.summarizeDocument()
  }

  copyToClipboard(): void {
    if (navigator.clipboard && this.summaryText) {
      navigator.clipboard
        .writeText(this.summaryText)
        .then(() => {
          console.log("Summary copied to clipboard")
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err)
        })
    }
  }

  downloadSummary(): void {
    if (!this.summaryText || !this.document) return

    const blob = new Blob([this.summaryText], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${this.document.name}_summary.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  getFileIcon(): string {
    if (!this.document) return "fa-file-alt"

    const type = this.document.type?.toLowerCase() || ""
    if (type.includes("pdf")) return "fa-file-pdf"
    if (type.includes("word") || type.includes("document")) return "fa-file-word"
    if (type.includes("excel") || type.includes("spreadsheet")) return "fa-file-excel"
    if (type.includes("powerpoint") || type.includes("presentation")) return "fa-file-powerpoint"
    if (type.includes("image")) return "fa-file-image"
    return "fa-file-alt"
  }

  getFileIconClass(): string {
    if (!this.document) return "default"

    const type = this.document.type?.toLowerCase() || ""
    if (type.includes("pdf")) return "pdf"
    if (type.includes("word") || type.includes("document")) return "word"
    if (type.includes("excel") || type.includes("spreadsheet")) return "excel"
    if (type.includes("image")) return "image"
    return "default"
  }
}
