import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FolderDetails } from './folder-details';

describe('FolderDetails', () => {
  let component: FolderDetails;
  let fixture: ComponentFixture<FolderDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderDetails, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-id' })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
