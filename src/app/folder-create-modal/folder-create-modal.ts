
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Validators, FormBuilder, FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-folder-create-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './folder-create-modal.html',
  styleUrl: './folder-create-modal.css'
})
export class FolderCreateModal {
 @Input() showModal = false;
  @Input() workspaceId!: string;
  @Input() FolderId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() folderCreated = new EventEmitter<{
    name: string;
    workspaceId: string;
    FolderId: string | null;
  }>();

  folderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.folderForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      workspaceId: [null],
      parentFolderId: [null]});
  }

  onSubmit() {
    if (this.folderForm.valid) {
    this.folderCreated.emit({
      name: this.folderForm.value.name,
      workspaceId: this.workspaceId,
      FolderId: this.FolderId
    });
    this.folderForm.reset();
  }

  }

  onClose() {
    this.folderForm.reset();
    this.closeModal.emit();
  }


}
