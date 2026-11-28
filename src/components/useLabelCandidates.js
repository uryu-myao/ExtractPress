import { useEffect, useState } from 'react';
import { readText } from '../../modules/photo-style';
import { labelCandidates } from '../data/labelText';

/**
 * Add a bag's label text candidates for a pending photo (src/data/labelText.ts):
 * Vision reads the photo beside the lift (never inside it), and the fixed
 * rules keep up to six lines. [] with no photo, while reading, when nothing
 * is left, or when reading fails (the candidates are an extra: no error).
 * A new photo starts again; a removed one clears them.
 *
 * Returns { candidates, readAt }: readAt is when the reading came back
 * (Date.now(), with or without candidates; null until then), for the
 * development timing line on Add a bag.
 *
 * Separable (brief, 2026-11-26: cut to 1.1 if not done by 2026-12-03):
 * this hook, labelText.ts and PhotoText.swift go together.
 */
export default function useLabelCandidates(photo) {
  const [state, setState] = useState({ candidates: [], readAt: null });
  const uri = photo?.uri ?? null;
  useEffect(() => {
    setState({ candidates: [], readAt: null });
    if (!uri) return undefined;
    let alive = true;
    readText(uri).then(
      (lines) => alive && setState({ candidates: labelCandidates(lines), readAt: Date.now() }),
      (error) => {
        console.warn('[label] could not read the text', error);
        if (alive) setState({ candidates: [], readAt: Date.now() });
      }
    );
    return () => {
      alive = false;
    };
  }, [uri]);
  return state;
}
