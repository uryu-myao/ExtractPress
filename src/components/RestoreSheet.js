import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { formatFullDate } from '../constants/dates';
import { BackupError, chooseBackupFile, readBackupFile, restoreBackup } from '../data/backup';
import { useDatabase } from '../data/DatabaseProvider';
import { countOwnRecords } from '../data/repository';
import { onRestoreRequest, requestShell } from '../navigation';
import { color, dashed, size, space, spacing } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import DashedRule from './base/DashedRule';
import Text from './base/Text';

/**
 * Restore from a backup (Design Round 23, 25f / 25g; design/import-v1.md):
 * the file picker, then one sheet that changes step. The engine is
 * data/backup.ts; this is its UI. Opened by requestRestore() (6b's row).
 *
 *   confirm  "Restore this backup?" / "From 8 Nov 2026: 214 cups, 9 bags, …"
 *            Restore (primary) · Cancel (secondary)
 *   working  "Restoring…" / "Photos 18 of 31" and a 4pt meter. No buttons,
 *            and it can't be closed while it runs.
 *   done     "All back." / the counts, then, when some photos didn't come
 *            back, a dashed soft divider and a line on them. Go to Home.
 *   refused  one form each, a title, one line, one button; no error colour
 *            (nothing in the app went wrong): not a backup, newer app,
 *            damaged, not empty.
 * Counts leave out a kind with none, in the singular at 1.
 *
 * TODO: with no photos in the file, "working" shows the title alone (25f
 * draws only the photo meter; the records go in at once). Ours.
 */
const number = new Intl.NumberFormat();

// TODO(i18n): plural rules beyond English's one / other.
const KINDS = [
  ['cups', 'cup', 'cups'],
  ['bags', 'bag', 'bags'],
  ['gear', 'gear', 'gear'],
  ['places', 'café', 'cafés'],
  ['photos', 'photo', 'photos'],
];

/** "214 cups, 9 bags and 31 photos": the kinds with any, in order. */
export function countsPhrase(counts) {
  const parts = KINDS.filter(([key]) => counts[key] > 0).map(([key, one, many]) => `${number.format(counts[key])} ${counts[key] === 1 ? one : many}`);
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

const REFUSALS = {
  not_a_backup: {
    title: "That file can't be restored.",
    body: 'It isn\'t an Extract Press backup. Exports are named "Extract Press backup ‹date›.zip".',
    again: true,
  },
  too_new: {
    title: 'Update first.',
    body: 'This backup comes from a newer version of Extract Press. Update the app, then try again.',
    again: false,
  },
  broken: {
    title: "That file can't be read.",
    body: 'It may be damaged or incomplete. Nothing was changed. Try another copy of the backup.',
    again: true,
  },
};

export function RestoreHost() {
  const db = useDatabase();
  const [step, setStep] = useState(null);

  const choose = async () => {
    setStep(null);
    let uri;
    try {
      uri = await chooseBackupFile();
    } catch (error) {
      console.error('[restore] picker failed', error);
      return;
    }
    if (!uri) return;
    try {
      const { backup, summary } = await readBackupFile(uri);
      setStep({ name: 'confirm', backup, summary });
    } catch (error) {
      setStep(await refusal(error));
    }
  };

  const refusal = async (error) => {
    if (error instanceof BackupError && error.reason === 'not_empty') {
      return { name: 'not_empty', live: await countOwnRecords(db) };
    }
    if (!(error instanceof BackupError)) console.error('[restore] failed', error);
    return { name: 'refused', reason: error instanceof BackupError ? error.reason : 'broken' };
  };

  useEffect(() => onRestoreRequest(choose), [db]);

  const restore = async ({ backup, summary }) => {
    setStep({ name: 'working', done: 0, total: summary.photos });
    try {
      const { photosMissing } = await restoreBackup(db, backup, (done, total) => setStep({ name: 'working', done, total }));
      setStep({ name: 'done', summary, photosMissing: photosMissing.length });
    } catch (error) {
      setStep(await refusal(error));
    }
  };

  const close = () => {
    if (step?.name !== 'working') setStep(null);
  };
  const goHome = () => {
    setStep(null);
    requestShell({ tab: 'home' });
  };

  return (
    <BottomSheet visible={step != null} onClose={close} swipeToClose={step?.name !== 'working'}>
      {step ? <StepContent step={step} onRestore={() => restore(step)} onClose={close} onAgain={choose} onHome={goHome} /> : null}
    </BottomSheet>
  );
}

function StepContent({ step, onRestore, onClose, onAgain, onHome }) {
  switch (step.name) {
    case 'confirm': {
      const { summary } = step;
      return (
        <Sheet title="Restore this backup?" body={`From ${formatFullDate(summary.exportedAt)}: ${countsPhrase(summary)}.`}>
          <Button label="Restore" onPress={onRestore} />
          <Button variant="secondary" label="Cancel" onPress={onClose} />
        </Sheet>
      );
    }
    case 'working':
      return (
        <Sheet title="Restoring…">
          {step.total > 0 ? (
            <View style={styles.progress}>
              <Text variant="body" color="secondary">
                {`Photos ${number.format(step.done)} of ${number.format(step.total)}`}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(100 * step.done) / step.total}%` }]} />
              </View>
            </View>
          ) : null}
        </Sheet>
      );
    case 'done': {
      const { cups, bags, gear, places } = step.summary;
      const missing = step.photosMissing;
      return (
        <Sheet title="All back." body={`${countsPhrase({ cups, bags, gear, places })} ${cups + bags + gear + places === 1 ? 'is' : 'are'} in. My taste DNA is rebuilt from them.`}>
          {missing > 0 ? (
            <View style={styles.missing}>
              <DashedRule token={dashed.dividerSoft} />
              <Text variant="body" color="secondary">
                {`${number.format(missing)} bag ${missing === 1 ? "photo wasn't" : "photos weren't"} in the file. Those bags show the placeholder; a photo can be added from each bag's page.`}
              </Text>
            </View>
          ) : null}
          <Button label="Go to Home" onPress={onHome} />
        </Sheet>
      );
    }
    case 'not_empty':
      return (
        <Sheet
          title="Only on an empty app."
          body={`There's already ${countsPhrase(step.live)} here. Restoring never merges or overwrites, so it works on an empty app only.`}>
          <Button variant="secondary" label="OK" onPress={onClose} />
        </Sheet>
      );
    default: {
      const refused = REFUSALS[step.reason] ?? REFUSALS.broken;
      return (
        <Sheet title={refused.title} body={refused.body}>
          {refused.again ? <Button variant="secondary" label="Choose another file" onPress={onAgain} /> : <Button variant="secondary" label="OK" onPress={onClose} />}
        </Sheet>
      );
    }
  }
}

/** Title (display.sm), body (14 / 21, secondary), then the step's own parts and buttons. */
function Sheet({ title, body, children }) {
  return (
    <>
      <Text variant="displaySm" color="primary">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="secondary">
          {body}
        </Text>
      ) : null}
      {children ? <View style={styles.after}>{children}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  // The buttons sit a step under the copy, as DiscardSheet's.
  after: {
    marginTop: space[8],
    gap: spacing.gap.section,
  },
  progress: {
    gap: space[8],
  },
  track: {
    height: size.meter.track,
    backgroundColor: color.border.subtle,
  },
  fill: {
    height: size.meter.track,
    backgroundColor: color.text.muted,
  },
  missing: {
    gap: space[12],
  },
});
