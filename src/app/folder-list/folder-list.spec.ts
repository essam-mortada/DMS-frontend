import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FolderList } from './folder-list';

describe('FolderList', () => {
  let component: FolderList;
  let fixture: ComponentFixture<FolderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderList, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
