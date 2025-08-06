import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSummaryModal } from './document-summary-modal';

describe('DocumentSummaryModal', () => {
  let component: DocumentSummaryModal;
  let fixture: ComponentFixture<DocumentSummaryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSummaryModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentSummaryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
