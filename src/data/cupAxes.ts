/**
 * Reading and writing cup_axes (migration 11; data-model.md "cup_axes").
 * One row per axis the drinker assessed; NOT NOTED IS THE ABSENCE OF A ROW.
 * In memory a cup's axes are the sparse form of the same thing, an object
 * { [axis id]: value } with no key for an axis not noted — never a null
 * value, never a default. axisVector() (constants/tasteAxes.js) turns it
 * into the dense, registry-ordered form.
 *
 * Driver-neutral: SQL text and pure parsing here, so the app (expo-sqlite),
 * the migrations and the node checks share it.
 */
import { isAxisId, isAxisValue } from '../constants/tasteAxes.js';

/** A cup's assessed axes: id → 1–5 in halves. A missing id is "not noted". */
export type CupAxes = Readonly<Record<string, number>>;

/**
 * A correlated subquery giving a cups row's axes as one JSON object
 * ('{"acidity":2.0,"body":4.5}', '{}' with none), for a SELECT over cups
 * aliased `alias`. One query instead of a second round trip per cup.
 */
export const axesJsonSql = (alias: string) => `(SELECT json_group_object(axis, value) FROM cup_axes WHERE cup_id = ${alias}.id)`;

/**
 * axesJsonSql's text (or an object already decoded) → CupAxes. Rows for an
 * id no longer in the registry are dropped, so retiring an axis needs no
 * migration either.
 */
export function parseAxes(json: string | Record<string, unknown> | null | undefined): CupAxes {
  const raw = json == null ? {} : typeof json === 'string' ? (JSON.parse(json) as Record<string, unknown>) : json;
  const axes: Record<string, number> = {};
  for (const [id, value] of Object.entries(raw)) if (isAxisId(id) && typeof value === 'number') axes[id] = value;
  return axes;
}

/**
 * The rows to write for a cup's axes: only the assessed ones. A null or
 * missing value writes nothing (not noted); an unknown id or an off-scale
 * value throws, before cup_axes' CHECK would.
 */
export function axisRows(axes: Readonly<Record<string, number | null | undefined>> | null | undefined): { axis: string; value: number }[] {
  const rows: { axis: string; value: number }[] = [];
  for (const [axis, value] of Object.entries(axes ?? {})) {
    if (value == null) continue;
    if (!isAxisId(axis)) throw new Error(`Unknown taste axis "${axis}".`);
    if (!isAxisValue(value)) throw new Error(`A taste axis takes 1–5 in halves, not ${value}.`);
    rows.push({ axis, value });
  }
  return rows;
}

export const INSERT_CUP_AXIS = 'INSERT INTO cup_axes (cup_id, axis, value) VALUES (?, ?, ?)';
