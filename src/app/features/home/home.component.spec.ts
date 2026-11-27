import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileIoService, SpendingsFileError, SpendingsFileErrorReason } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { SpendingsFile, StoredFile } from '@shared/models';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const emptyFile: SpendingsFile = {
    version: 1,
    createdAt: '2026-11-27T17:00:00.000Z',
    updatedAt: '2026-11-27T17:00:00.000Z',
    spendings: [],
  };
  const stored: StoredFile = {
    file: { ...emptyFile, spendings: [{}, {}] },
    meta: { name: 'mine.json', size: 123, savedAt: '2026-11-27T17:00:00.000Z' },
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
      serialize: vi.fn().mockReturnValue('{}'),
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

    expect(element.querySelector('[data-testid="file-name"]')?.textContent).toContain('mine.json');
    expect(element.querySelector('[data-testid="spendings-count"]')?.textContent).toContain('2');
    expect(element.textContent).toContain('123 bytes');
  });

  it('should download the stored file', async () => {
    storage.load.mockResolvedValue(stored);
    const { element } = await render();

    buttonByText(element, 'Download').click();

    expect(fileIo.download).toHaveBeenCalledWith(stored.file, 'mine.json');
  });

  it('should create, store and download a new file', async () => {
    const { fixture, element } = await render();

    buttonByText(element, 'Create new file').click();
    await fixture.whenStable();

    expect(storage.save).toHaveBeenCalledWith(emptyFile, expect.objectContaining({ name: 'money-tracker.json' }));
    expect(fileIo.download).toHaveBeenCalledWith(emptyFile, 'money-tracker.json');
    expect(element.querySelector('[data-testid="file-name"]')?.textContent).toContain('money-tracker.json');
  });

  it('should store an opened file', async () => {
    const picked = new File(['{}'], 'picked.json');
    fileIo.readFile.mockResolvedValue(stored.file);
    const { fixture, element } = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [picked] });

    input?.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(storage.save).toHaveBeenCalledWith(stored.file, expect.objectContaining({ name: 'picked.json' }));
    expect(element.querySelector('[data-testid="spendings-count"]')?.textContent).toContain('2');
  });

  it('should show a validation error for an invalid file', async () => {
    fileIo.readFile.mockRejectedValue(new SpendingsFileError(SpendingsFileErrorReason.InvalidJson, 'Not JSON.'));
    const { fixture, element } = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'bad.json')] });

    input?.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Not JSON.');
    expect(storage.save).not.toHaveBeenCalled();
  });
});
