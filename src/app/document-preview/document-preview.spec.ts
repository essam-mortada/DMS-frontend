import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DocumentPreview } from './document-preview';
import { DomSanitizer } from '@angular/platform-browser';

describe('DocumentPreview', () => {
  let component: DocumentPreview;
  let fixture: ComponentFixture<DocumentPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentPreview, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-id' })
          }
        },
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: (url: string) => url
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
