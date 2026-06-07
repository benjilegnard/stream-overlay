import { TestBed } from '@angular/core/testing';
import { OverlayComponent } from './overlay.component';

describe('OverlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(OverlayComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have as title 'benjilegnard'`, () => {
    const fixture = TestBed.createComponent(OverlayComponent);
    expect(fixture.componentInstance.title).toEqual('benjilegnard');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(OverlayComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('benjilegnard');
  });
});
