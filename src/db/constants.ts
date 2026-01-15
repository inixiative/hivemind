import { homedir } from 'os';
import { join } from 'path';

/**
 * Base hivemind directory: ~/.hivemind
 */
export const HIVEMIND_BASE = process.env.HIVEMIND_BASE || join(homedir(), '.hivemind');
