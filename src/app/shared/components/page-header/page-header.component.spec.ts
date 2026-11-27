import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SideMenuService } from '@core/layout';

import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('heading', 'Spendings');
    element = fixture.nativeElement as HTMLElement;
  });

  it('should show the heading and open the menu from the menu button', async () => {
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain('Spendings');
    element.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')?.click();
    expect(TestBed.inject(SideMenuService).isOpen()).toBe(true);
  });

  it('should show a back link instead of the menu button when backLink is set', async () => {
    fixture.componentRef.setInput('backLink', '/');
    await fixture.whenStable();

    expect(element.querySelector('a[aria-label="Back"]')?.getAttribute('href')).toBe('/');
    expect(element.querySelector('button')).toBeNull();
  });
});
