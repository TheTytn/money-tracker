import { TestBed } from '@angular/core/testing';

import { CURRENT_SCHEMA_VERSION, SpendingsFile } from '@shared/models';

import { DEFAULT_FILE_NAME, FileIoService } from './file-io.service';
import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

describe('FileIoService', () => {
  const sample: SpendingsFile = {
    version: 1,
    createdAt: '2026-11-27T17:00:00.000Z',
    updatedAt: '2026-11-27T17:00:00.000Z',
    spendings: [],
  };
  const toFile = (content: string) => new File([content], 'data.json', { type: 'application/json' });

  let service: FileIoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileIoService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  describe('readFile', () => {
    it('should read a valid data file', async () => {
      const data = { ...sample, spendings: [{ amount: 5 }] };

      expect(await service.readFile(toFile(JSON.stringify(data)))).toEqual(data);
    });

    it('should reject invalid JSON', async () => {
      const error = await service.readFile(toFile('{ not json')).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SpendingsFileError);
      expect((error as SpendingsFileError).reason).toBe(SpendingsFileErrorReason.InvalidJson);
    });

    it.each([
      ['an array', '[]'],
      ['null', 'null'],
      ['a missing version', '{"spendings": []}'],
      ['a non-numeric version', '{"version": "1", "spendings": []}'],
      ['missing spendings', '{"version": 1}'],
      ['non-array spendings', '{"version": 1, "spendings": {}}'],
    ])('should reject %s', async (_label, content) => {
      const error = await service.readFile(toFile(content)).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SpendingsFileError);
      expect((error as SpendingsFileError).reason).toBe(SpendingsFileErrorReason.InvalidStructure);
    });
  });

  describe('createEmpty', () => {
    it('should create an empty file with the current schema version', () => {
      const file = service.createEmpty();

      expect(file.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(file.spendings).toEqual([]);
      expect(file.createdAt).toBe(file.updatedAt);
      expect(new Date(file.createdAt).toISOString()).toBe(file.createdAt);
    });
  });

  describe('download', () => {
    it('should share the file when the Web Share API supports files', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
      Object.defineProperty(navigator, 'share', { value: share, configurable: true });

      await service.download(sample);

      const shared = share.mock.calls[0][0].files[0] as File;
      expect(shared.name).toBe(DEFAULT_FILE_NAME);
      expect(JSON.parse(await shared.text())).toEqual(sample);
    });

    it('should ignore the user cancelling the share sheet', async () => {
      Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
        configurable: true,
      });

      await expect(service.download(sample)).resolves.toBeUndefined();
    });

    it('should fall back to a download link when sharing files is not supported', async () => {
      const createObjectURL = vi.fn().mockReturnValue('blob:test');
      const revokeObjectURL = vi.fn();
      Object.assign(URL, { createObjectURL, revokeObjectURL });
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      await service.download(sample, 'backup.json');

      const clicked = click.mock.contexts[0] as HTMLAnchorElement | undefined;
      expect(click).toHaveBeenCalledTimes(1);
      expect(clicked?.download).toBe('backup.json');
      expect(clicked?.href).toBe('blob:test');
      expect(clicked?.isConnected).toBe(false);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(JSON.parse(await blob.text())).toEqual(sample);
    });
  });
});
