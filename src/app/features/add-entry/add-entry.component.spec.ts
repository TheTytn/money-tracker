import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { FileIoService } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { toIsoDate } from '@shared/helpers';
import { Spending, StoredFile } from '@shared/models';

import { AddEntryComponent } from './add-entry.component';

describe('AddEntryComponent', () => {
  const spending: Spending = {
    date: '2026-11-01',
    account: 'Card',
    category: 'Groceries',
    amount: -12.5,
    currency: 'UAH',
    convertedAmount: -12.5,
    convertedCurrency: 'UAH',
    description: '',
  };
  const salary: Spending = { ...spending, category: 'Salary', amount: 1000, convertedAmount: 1000 };
  const stored: StoredFile = {
    file: { spendings: [salary, spending] },
    meta: { name: 'mine.csv', size: 123, savedAt: '2026-11-27T17:00:00.000Z' },
  };

  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<AddEntryComponent>;
  let element: HTMLElement;

  function buttonByText(text: string): HTMLButtonElement {
    const button = Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
    if (!button) {
      throw new Error(`Button "${text}" not found`);
    }
    return button;
  }

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Input ${selector} not found`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function render(entryType = 'spending'): Promise<void> {
    fixture = TestBed.createComponent(AddEntryComponent);
    fixture.componentRef.setInput('type', entryType);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    storage = { load: vi.fn().mockResolvedValue(stored), save: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [AddEntryComponent],
      providers: [
        provideRouter([]),
        { provide: FileStorageService, useValue: storage },
        { provide: FileIoService, useValue: { serialize: vi.fn().mockReturnValue('csv') } },
      ],
    }).compileComponents();
  });

  it('should default the date to today and suggest expense categories', async () => {
    await render();

    expect(element.querySelector('h1')?.textContent).toContain('Add spending');
    expect(element.querySelector<HTMLInputElement>('#entry-date')?.value).toBe(toIsoDate(new Date()));
    expect(buttonByText('Groceries')).toBeTruthy();
    expect(element.textContent).not.toContain('Salary');
  });

  it('should save a spending as a negative row and go back to the main page', async () => {
    await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    type('#entry-amount', '42.5');
    buttonByText('Groceries').click();
    type('#entry-date', '2026-11-20');
    buttonByText('Save').click();
    await fixture.whenStable();

    expect(storage.save).toHaveBeenCalledWith(
      {
        spendings: [salary, spending, { ...spending, date: '2026-11-20', amount: -42.5, convertedAmount: -42.5 }],
      },
      expect.objectContaining({ name: 'mine.csv' }),
    );
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('should save an income with a new category as a positive row', async () => {
    await render('income');
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    expect(element.querySelector('h1')?.textContent).toContain('Add income');
    type('#entry-amount', '300');
    type('#entry-category', 'Gifts');
    buttonByText('Save').click();
    await fixture.whenStable();

    const saved = storage.save.mock.calls[0][0].spendings.at(-1) as Spending;
    expect(saved).toEqual(expect.objectContaining({ category: 'Gifts', amount: 300, convertedAmount: 300 }));
  });

  it('should switch between spending and income', async () => {
    await render();

    buttonByText('Income').click();
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain('Add income');
    expect(buttonByText('Salary')).toBeTruthy();
  });

  it('should not save without an amount and a category', async () => {
    await render();

    buttonByText('Save').click();
    await fixture.whenStable();

    expect(storage.save).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter an amount greater than zero.');
    expect(element.textContent).toContain('Choose or type a category.');
  });
});
