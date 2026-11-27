import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileIoService, SpendingsFileError, SpendingsFileErrorReason } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { Spending, SpendingsFile, StoredFile } from '@shared/models';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const emptyFile: SpendingsFile = { spendings: [] };
  const spending: Spending = {
    date: '2024-02-03',
    account: 'Cash',
    category: 'Groceries',
    amount: -12.5,
    currency: 'EUR',
    convertedAmount: -12.5,
    convertedCurrency: 'EUR',
    description: '',
  };
  const stored: StoredFile = {
    file: { spendings: [spending, { ...spending, amount: -3 }] },
    meta: { name: 'mine.csv', size: 123, savedAt: '2026-11-27T17:00:00.000Z' },
  };

  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let fileIo: {
    readFile: ReturnType<typeof vi.fn>;
    createEmpty: ReturnType<typeof vi.fn>;
    serialize: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
  };

  async function render(): Promise<{ fixture: ComponentFixture<HomeComponent>; element: HTMLElement }> {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function buttonByText(element: HTMLElement, text: string): HTMLButtonElement {
    const button = Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
    if (!button) {
      throw new Error(`Button "${text}" not found`);
    }
    return button;
  }

  beforeEach(async () => {
    storage = { load: vi.fn().mockResolvedValue(undefined), save: vi.fn().mockResolvedValue(undefined) };
    fileIo = {
      readFile: vi.fn(),
      createEmpty: vi.fn().mockReturnValue(emptyFile),
      serialize: vi.fn().mockReturnValue('header\n'),
      download: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: FileStorageService, useValue: storage },
        { provide: FileIoService, useValue: fileIo },
      ],
    }).compileComponents();
  });

  it('should show the open and create buttons and an empty state', async () => {
    const { element } = await render();

    expect(buttonByText(element, 'Open file')).toBeTruthy();
    expect(buttonByText(element, 'Create new file')).toBeTruthy();
    expect(element.textContent).toContain('No file stored yet');
  });

  it('should show info about the stored file', async () => {
    storage.load.mockResolvedValue(stored);

    const { element } = await render();

    expect(element.querySelector('[data-testid="file-name"]')?.textContent).toContain('mine.csv');
    expect(element.querySelector('[data-testid="spendings-count"]')?.textContent).toContain('2');
    expect(element.textContent).toContain('123 bytes');
  });

  it('should download the stored file', async () => {
    storage.load.mockResolvedValue(stored);
    const { element } = await render();

    buttonByText(element, 'Download').click();

    expect(fileIo.download).toHaveBeenCalledWith(stored.file, 'mine.csv');
  });

  it('should create, store and download a new file', async () => {
    const { fixture, element } = await render();

    buttonByText(element, 'Create new file').click();
    await fixture.whenStable();

    expect(storage.save).toHaveBeenCalledWith(emptyFile, expect.objectContaining({ name: 'money-tracker.csv' }));
    expect(fileIo.download).toHaveBeenCalledWith(emptyFile, 'money-tracker.csv');
    expect(element.querySelector('[data-testid="file-name"]')?.textContent).toContain('money-tracker.csv');
  });

  it('should store an opened file', async () => {
    const picked = new File(['header\n'], 'picked.csv');
    fileIo.readFile.mockResolvedValue(stored.file);
    const { fixture, element } = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [picked] });

    input?.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(storage.save).toHaveBeenCalledWith(stored.file, expect.objectContaining({ name: 'picked.csv' }));
    expect(element.querySelector('[data-testid="spendings-count"]')?.textContent).toContain('2');
  });

  it('should show a validation error for an invalid file', async () => {
    fileIo.readFile.mockRejectedValue(new SpendingsFileError(SpendingsFileErrorReason.InvalidRow, 'Line 2: bad row.'));
    const { fixture, element } = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'bad.csv')] });

    input?.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Line 2: bad row.');
    expect(storage.save).not.toHaveBeenCalled();
  });
});
