import {TestBed} from '@angular/core/testing';
jest.mock('delaunator');
import {AppComponent} from './app.component';
import {BackgroundComponent} from './shared/components/background/background.component';
import {Component} from '@angular/core';
@Component({selector: 'app-background'})
class BackgroundStubComponent {}
describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
		})
			.overrideComponent(AppComponent, {
				add: {
					imports: [BackgroundStubComponent],
				},
				remove: {imports: [BackgroundComponent]},
			})
			.compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it(`should have as title 'benjilegnard'`, () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app.title).toEqual('benjilegnard');
	});

	it('should render title', () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
		const compiled = fixture.nativeElement;
		expect(compiled.querySelector('h1').textContent).toContain('benjilegnard');
	});
});
