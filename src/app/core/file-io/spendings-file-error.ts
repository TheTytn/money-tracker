export const SpendingsFileErrorReason = {
  InvalidJson: 'invalid-json',
  InvalidStructure: 'invalid-structure',
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
