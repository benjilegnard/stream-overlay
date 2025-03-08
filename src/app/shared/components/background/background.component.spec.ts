import {DOCUMENT} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BackgroundComponent} from './background.component';
import {
	BACKGROUND_DRAWER,
	BackgroundDrawer,
} from '../../services/background-drawer.token';

describe('BackgroundComponent', () => {
	let component: BackgroundComponent;
	let fixture: ComponentFixture<BackgroundComponent>;
	let drawerStub: Partial<BackgroundDrawer>;

	beforeEach(async () => {
		drawerStub = {
			initialize: jest.fn(),
			resize: jest.fn(),
		};
		await TestBed.configureTestingModule({
			imports: [BackgroundComponent],
		})
			.overrideComponent(BackgroundComponent, {
				set: {
					providers: [
						{
							provide: BACKGROUND_DRAWER,
							useValue: drawerStub,
						},
					],
				},
			})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(BackgroundComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
	describe('when the window is resized', () => {
		it('should assign window width to canvas width', () => {
			// execute
			component.windowResize({
				target: {innerWidth: 640, innerHeight: 480} as unknown as EventTarget,
			} as Event);
			// verify
			expect(drawerStub.resize).toHaveBeenCalledWith(640, 480);
		});
	});
});
