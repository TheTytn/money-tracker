import { TestBed } from '@angular/core/testing';

import { SpendingsFile } from '@shared/models';

import { DEFAULT_FILE_NAME, FileIoService } from './file-io.service';
import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

describe('FileIoService', () => {
  const header = 'date,account,category,amount,currency,converted amount,currency,description';
  const row = '03/02/2024,Готівка,Продукти,"-1,250.5",UAH,"-1,250.5",UAH,Хліб';
  const csv = `${header}\n${row}\n`;
  const sample: SpendingsFile = {
    spendings: [
      {
        date: '2024-02-03',
        account: 'Готівка',
        category: 'Продукти',
        amount: -1250.5,
        currency: 'UAH',
        convertedAmount: -1250.5,
        convertedCurrency: 'UAH',
        description: 'Хліб',
      },
    ],
  };
  const toFile = (content: BlobPart) => new File([content], 'data.csv', { type: 'text/csv' });
  /** Encodes Cyrillic (and ASCII) text as Windows-1251 bytes, the way a legacy export would. */
  const toWindows1251 = (text: string): Uint8Array<ArrayBuffer> =>
    Uint8Array.from(
      Array.from(text, (char) => {
        const code = char.charCodeAt(0);
        if (code < 0x80) {
          return code;
        }
        if (code >= 0x410 && code <= 0x44f) {
          return code - 0x350;
        }
        const extra: Record<string, number> = {
          і: 0xb3,
          І: 0xb2,
          ї: 0xbf,
          Ї: 0xaf,
          є: 0xba,
          Є: 0xaa,
          ё: 0xb8,
          Ё: 0xa8,
        };
        return extra[char] ?? 0x3f;
      }),
    );

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
    it('should read a UTF-8 CSV file', async () => {
      expect(await service.readFile(toFile(csv))).toEqual(sample);
    });

    it('should read a UTF-8 CSV file with a BOM', async () => {
      expect(await service.readFile(toFile('\uFEFF' + csv))).toEqual(sample);
    });

    it('should read a Windows-1251 CSV file', async () => {
      expect(await service.readFile(toFile(toWindows1251(csv)))).toEqual(sample);
    });

    it('should reject a file that is not a data file', async () => {
      const error = await service.readFile(toFile('{"version": 1}')).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SpendingsFileError);
      expect((error as SpendingsFileError).reason).toBe(SpendingsFileErrorReason.InvalidHeader);
    });
  });

  describe('createEmpty', () => {
    it('should create a file with no spendings', () => {
      expect(service.createEmpty()).toEqual({ spendings: [] });
    });
  });

  describe('serialize', () => {
    it('should write CSV with a UTF-8 BOM', () => {
      expect(service.serialize(sample)).toBe('\uFEFF' + csv);
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
      expect(shared.type).toBe('text/csv');
      expect(await service.readFile(shared)).toEqual(sample);
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

      await service.download(sample, 'backup.csv');

      const clicked = click.mock.contexts[0] as HTMLAnchorElement | undefined;
      expect(click).toHaveBeenCalledTimes(1);
      expect(clicked?.download).toBe('backup.csv');
      expect(clicked?.href).toBe('blob:test');
      expect(clicked?.isConnected).toBe(false);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(await service.readFile(new File([blob], 'x.csv'))).toEqual(sample);
    });
  });
});
