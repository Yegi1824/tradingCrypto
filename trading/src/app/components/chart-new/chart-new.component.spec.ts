import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartNewComponent } from './chart-new.component';

describe('ChartNewComponent', () => {
  let component: ChartNewComponent;
  let fixture: ComponentFixture<ChartNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartNewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
