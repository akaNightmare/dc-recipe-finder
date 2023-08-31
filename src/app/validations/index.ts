import Ajv from 'ajv';
import AjvFormats from 'ajv-formats';
import AjvKeywords from 'ajv-keywords';

import { historySchema } from './schemas';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
AjvKeywords(ajv);
AjvFormats(ajv);

export const historyValidator = ajv.compile(historySchema.valueOf());
