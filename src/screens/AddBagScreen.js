import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import BagForm from '../components/BagForm';
import DateSheet from '../components/DateSheet';
import PhotoSheet from '../components/PhotoSheet';
import Button from '../components/base/Button';
import IconButton from '../components/base/IconButton';
import Text from '../components/base/Text';
import { useRecordDraftIfAny } from '../components/RecordDraft';
import { useDatabase } from '../data/DatabaseProvider';
import { deletePhoto, dropPhoto, keepPhoto } from '../data/photos';
import { startOfDay } from '../constants/dates';
import { OPEN_BAG_LIMIT, countCups, countOpenBags, getBagDateKind, insertBag, setBagDateKind } from '../data/repository';
import { spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 3c (minimal) — "Add a bag", pushed from 5a's "Add a bag" row inside the
 * Record sheet (design/components.md: the screen is 3c; its content is the
 * Bag form, minimal set). When the full 3c is built this screen becomes it,
 * with the same entry points.
 *
 * "Open this bag" stores the bag, opened now, makes it the cup's bag and goes
 * back to 5a. "Add without opening" stores it unopened (it takes a slot; 3d
 * opens it later). onAdded, when given, replaces Back after a save (Home → 3d). The name is the only required field. At 5 open bags the button
 * is disabled and the line under it says why (3c's copy).
 *
 * First cup (Uryu, 2026-11-09): reached from the Record sheet before any
 * cup is logged, a line over the form says only the name is needed and the
 * rest can be changed later, so logging the first cup doesn't feel like a
 * long form. Body, text.secondary, gap.section above the form. Copy and
 * placement are ours (not drawn); TODO: Design to confirm.
 *
 * Photo (2026-11-01, bags first): 3c's slot over the fields opens PhotoSheet;
 * the chosen photo (already styled) waits in the cache and is kept only when
 * the bag is added. Leaving without adding drops it.
 */
/**
 * prefill: { name, roaster } from Try next's "Add it to my beans" (Design
 * Round 23, 25d: buying a bean again); the fields start filled, still editable.
 */
/** 3c's date sheet's two kinds (29a). */
const DATE_KINDS = [
  { value: 'roasted', label: 'Roasted on' },
  { value: 'bestBefore', label: 'Best before' },
];

export default function AddBagScreen({ onBack, onAdded, prefill }) {
  const db = useDatabase();
  // In the Record sheet the new bag becomes the cup's bag; from 3d it just joins the shelf.
  const chooseBag = useRecordDraftIfAny()?.chooseBag;
  const [form, setForm] = useState({ name: prefill?.name ?? '', roaster: prefill?.roaster ?? '', process: null });
  // The date printed on the bag and its kind (Design Round 27 B1, 29a): one
  // date here; the bag's other one is added on its page (19a). The kind
  // starts where it was last left (device.bag_date_kind).
  const [bagDate, setBagDate] = useState({ kind: 'roasted', value: null });
  const [picking, setPicking] = useState(false);
  // 5d's way (decided 2026-10-11): the button stays pressable; pressed with no
  // name, the field says it is required. Typing a name ends it.
  const [nameMissing, setNameMissing] = useState(false);
  const [open, setOpen] = useState(null);
  const [firstCup, setFirstCup] = useState(false);
  // A prepared photo (data/photos.ts), not kept until the bag is added.
  const [photo, setPhoto] = useState(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const pending = useRef(null);
  pending.current = photo;
  useEffect(() => () => pending.current && dropPhoto(pending.current.id), []);

  useEffect(() => {
    let alive = true;
    countOpenBags(db).then((n) => alive && setOpen(n), () => alive && setOpen(0));
    getBagDateKind(db).then((kind) => alive && setBagDate((d) => ({ ...d, kind })), () => {});
    if (chooseBag) countCups(db).then((n) => alive && setFirstCup(n === 0), () => {});
    return () => {
      alive = false;
    };
  }, [db, chooseBag]);

  const full = open != null && open >= OPEN_BAG_LIMIT;
  const free = open == null ? null : OPEN_BAG_LIMIT - open;
  const name = form.name.trim();

  const addBag = async (opened) => {
    if (!name) {
      setNameMissing(true);
      return;
    }
    let kept = null;
    try {
      if (photo) {
        await keepPhoto(photo.id);
        kept = photo.id;
        pending.current = null;
      }
      const bag = await insertBag(db, {
        name,
        roaster: form.roaster.trim() || null,
        roastedAt: bagDate.kind === 'roasted' ? bagDate.value : null,
        bestBefore: bagDate.kind === 'bestBefore' ? bagDate.value : null,
        process: form.process,
        open: opened,
        photo: kept,
      });
      // Only an opened bag can be the cup's bag.
      if (opened) chooseBag?.(bag);
      (onAdded ?? onBack)();
    } catch (error) {
      // A photo kept for a bag that wasn't added would be an orphan.
      if (kept) {
        deletePhoto(kept);
        setPhoto(null);
      }
      console.error('[bag] could not add', error);
      Alert.alert("This bag wasn't added", `What you typed is still here. ${String(error?.message ?? error)}`);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenFrame
        scroll
        compact
        title="Add a bag"
        leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}
        stat={open != null ? { value: `${open} / ${OPEN_BAG_LIMIT}`, label: 'On the shelf' } : undefined}
        footer={
          <View style={styles.footer}>
            {/* Full: the line below says why, so a press warns (§1). An empty
                name is not a disabled state: the press shows the field's error. */}
            <Button label="Open this bag" onPress={() => addBag(true)} disabled={full || open == null} warnWhenDisabled={full} />
            {/* Added, not opened (2026-10-12): it takes a slot and is opened
                later from 3d. Copy confirmed (Design's reply to brief 18). */}
            <Button variant="secondary" label="Add without opening" onPress={() => addBag(false)} disabled={full || open == null} warnWhenDisabled={full} />
            {free != null ? (
              <Text variant="bodySm" color="secondary" style={styles.slots}>
                {full ? 'No slots free. Finish a bag to free one up.' : `${free} of ${OPEN_BAG_LIMIT} slots free. Finish a bag to free one up.`}
              </Text>
            ) : null}
          </View>
        }>
        {firstCup ? (
          <Text variant="body" color="secondary" style={styles.firstCup}>
            Just the name is needed for now. The rest can be added or changed any time in My beans.
          </Text>
        ) : null}
        <BagForm
          value={form}
          onChange={(next) => {
            if (next.name.trim()) setNameMissing(false);
            setForm(next);
          }}
          nameMissing={nameMissing}
          bagDate={{
            kind: bagDate.kind,
            value: bagDate.value,
            picking,
            onPick: () => {
              Keyboard.dismiss();
              setPicking(true);
            },
          }}
          photo={{
            uri: photo?.uri ?? null,
            onPress: () => {
              Keyboard.dismiss();
              setPhotoSheet(true);
            },
          }}
        />
      </ScreenFrame>
      <PhotoSheet
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        onChosen={(next) => {
          if (photo) dropPhoto(photo.id);
          setPhoto(next);
          setPhotoSheet(false);
        }}
        onRemove={
          photo
            ? () => {
                dropPhoto(photo.id);
                setPhoto(null);
              }
            : undefined
        }
      />
      {/* Roasted on can't be in the future; Best before can be either side of today (29a). */}
      <DateSheet
        visible={picking}
        onClose={() => setPicking(false)}
        label="Date on the bag"
        value={bagDate.value}
        maximum={bagDate.kind === 'roasted' ? new Date() : undefined}
        onChange={(value) => setBagDate((d) => ({ ...d, value }))}
        kinds={{
          options: DATE_KINDS,
          value: bagDate.kind,
          onChange: (kind) => {
            setBagDateKind(db, kind).catch(() => {});
            // A future best-before date can't stay a roast date: it stops at today.
            setBagDate((d) => ({ kind, value: kind === 'roasted' && d.value != null ? Math.min(d.value, startOfDay(new Date())) : d.value }));
          },
        }}
        note="Supermarket bags print a best-before date. Both on one bag? Add the other in the bag's page later."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  footer: {
    gap: spacing.gap.row,
  },
  slots: {
    textAlign: 'center',
  },
  firstCup: {
    marginBottom: spacing.gap.section,
  },
});
