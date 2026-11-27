export const SpendingsFileErrorReason = {
  UnsupportedEncoding: 'unsupported-encoding',
  InvalidHeader: 'invalid-header',
  InvalidRow: 'invalid-row',
} as const;

export type SpendingsFileErrorReason = (typeof SpendingsFileErrorReason)[keyof typeof SpendingsFileErrorReason];

/** Thrown when a file can't be read as a data file. */
export class SpendingsFileError extends Error {
  constructor(
    readonly reason: SpendingsFileErrorReason,
    message: string,
  ) {
    super(message);
    this.name = 'SpendingsFileError';
  }
}
