import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDocumentModal } from './upload-document-modal';

describe('UploadDocumentModal', () => {
  let component: UploadDocumentModal;
  let fixture: ComponentFixture<UploadDocumentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDocumentModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDocumentModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
