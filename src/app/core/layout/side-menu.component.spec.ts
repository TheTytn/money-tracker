import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SideMenuComponent } from './side-menu.component';
import { SideMenuService } from './side-menu.service';

describe('SideMenuComponent', () => {
  let fixture: ComponentFixture<SideMenuComponent>;
  let element: HTMLElement;
  let menu: SideMenuService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SideMenuComponent);
    element = fixture.nativeElement as HTMLElement;
    menu = TestBed.inject(SideMenuService);
  });

  it('should render nothing while closed', async () => {
    await fixture.whenStable();

    expect(element.querySelector('nav')).toBeNull();
  });

  it('should show Home and Settings links when open', async () => {
    menu.open();
    await fixture.whenStable();

    const links = Array.from(element.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Home', 'Settings']);
  });

  it('should close when a link, the backdrop or Escape is used', async () => {
    menu.open();
    await fixture.whenStable();
    element.querySelector<HTMLAnchorElement>('a')?.click();
    expect(menu.isOpen()).toBe(false);

    menu.open();
    await fixture.whenStable();
    element.querySelector<HTMLElement>('.side-menu__scrim')?.click();
    expect(menu.isOpen()).toBe(false);

    menu.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.isOpen()).toBe(false);
  });
});
