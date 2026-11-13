import { axisById } from '../constants/tasteAxes';
import { color } from './tokens';

/** An axis's identity colour (tokens.ts color.axis), through its registry entry's colorToken. */
export const axisColor = (id) => color.axis[axisById(id)?.colorToken];
