import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderCreateModal } from './folder-create-modal';

describe('FolderCreateModal', () => {
  let component: FolderCreateModal;
  let fixture: ComponentFixture<FolderCreateModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderCreateModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolderCreateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
