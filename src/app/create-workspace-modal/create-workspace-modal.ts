import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { WorkspaceService } from '../services/workspaceService';
import { BrowserModule} from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-create-workspace-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-workspace-modal.html',
  styleUrl: './create-workspace-modal.css'
})
export class CreateWorkspaceModal {

   @Output() onCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

 form: any;

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }
  createWorkspace() {
    if (this.form.valid) {
      this.workspaceService.create(this.form.value).subscribe({
        next: () => {
          this.onCreated.emit();
          this.form.reset();
          this.closeModal();
        },
        error: (err) => alert('Error creating workspace')
      });
    }
  }

  closeModal() {
    this.close.emit();
  }

  isModalActive(): boolean {
    return document.getElementById('createWorkspaceModal')?.classList.contains('active') || false;
  }
}
