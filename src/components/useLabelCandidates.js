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
 * Separable (brief, 2026-11-26: cut to 1.1 if not done by 2026-12-03):
 * this hook, labelText.ts and PhotoText.swift go together.
 */
export default function useLabelCandidates(photo) {
  const [candidates, setCandidates] = useState([]);
  const uri = photo?.uri ?? null;
  useEffect(() => {
    setCandidates([]);
    if (!uri) return undefined;
    let alive = true;
    readText(uri).then(
      (lines) => alive && setCandidates(labelCandidates(lines)),
      (error) => console.warn('[label] could not read the text', error)
    );
    return () => {
      alive = false;
    };
  }, [uri]);
  return candidates;
}
