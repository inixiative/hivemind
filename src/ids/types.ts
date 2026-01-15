/**
 * Valid ID type prefixes
 */
export type IdType = 'agt' | 'pln' | 'tsk' | 'evt';

/**
 * Parsed ID components
 */
export type ParsedId = {
  type: IdType;
  hex: string;
  seq?: string;
  label?: string;
  raw: string;
};
