import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FileIoService } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { toIsoMonth } from '@shared/helpers';
import { Spending, StoredFile } from '@shared/models';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const thisMonth = toIsoMonth(new Date());
  const spending: Spending = {
    date: `${thisMonth}-03`,
    account: 'Cash',
    category: 'Groceries',
    amount: -12.5,
    currency: 'UAH',
    convertedAmount: -12.5,
    convertedCurrency: 'UAH',
    description: '',
  };
  const stored: StoredFile = {
    file: { spendings: [spending, { ...spending, category: 'Taxi', amount: -7.5, convertedAmount: -7.5 }] },
    meta: { name: 'mine.csv', size: 123, savedAt: '2026-11-27T17:00:00.000Z' },
  };

  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  async function render(): Promise<{ fixture: ComponentFixture<HomeComponent>; element: HTMLElement }> {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function buttonByLabel(element: HTMLElement, label: string): HTMLButtonElement {
    const button = element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!button) {
      throw new Error(`Button "${label}" not found`);
    }
    return button;
  }

  beforeEach(async () => {
    storage = { load: vi.fn().mockResolvedValue(stored), save: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: FileStorageService, useValue: storage },
        { provide: FileIoService, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should chart this month spendings by category', async () => {
    const { element } = await render();

    expect(element.querySelectorAll('.legend__item')).toHaveLength(2);
    expect(element.querySelector('[data-testid="chart-total"]')?.textContent).toContain('20.00');
    expect(element.textContent).toContain('Total, UAH');
  });

  it('should switch months', async () => {
    const { fixture, element } = await render();
    const label = element.querySelector('[data-testid="month"]')?.textContent;

    buttonByLabel(element, 'Previous month').click();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="month"]')?.textContent).not.toBe(label);
    expect(element.textContent).toContain('No spendings this month.');

    buttonByLabel(element, 'Next month').click();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="month"]')?.textContent).toBe(label);
  });

  it('should point to Settings when no file is stored', async () => {
    storage.load.mockResolvedValue(undefined);

    const { element } = await render();

    expect(element.textContent).toContain('No data yet.');
    expect(element.querySelector('a[href="/settings"]')).not.toBeNull();
  });

  it('should link to the add spending and add income pages', async () => {
    const { element } = await render();

    expect(element.querySelector('a[href="/add/spending"]')?.textContent).toContain('Spending');
    expect(element.querySelector('a[href="/add/income"]')?.textContent).toContain('Income');
  });

  it('should have a menu button', async () => {
    const { element } = await render();

    expect(buttonByLabel(element, 'Open menu')).toBeTruthy();
  });
});
