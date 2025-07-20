import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderBreadcrumbs } from './folder-breadcrumbs';

describe('FolderBreadcrumbs', () => {
  let component: FolderBreadcrumbs;
  let fixture: ComponentFixture<FolderBreadcrumbs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderBreadcrumbs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderBreadcrumbs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
