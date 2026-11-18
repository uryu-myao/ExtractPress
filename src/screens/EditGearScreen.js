import { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Field } from '../components/BagForm';
import DiscardSheet from '../components/DiscardSheet';
import ItemCups, { useFilteredCups } from '../components/ItemCups';
import NoteField from '../components/NoteField';
import PhotoSheet from '../components/PhotoSheet';
import SaveBar from '../components/SaveBar';
import BottomSheet from '../components/base/BottomSheet';
import Button from '../components/base/Button';
import DashedRule from '../components/base/DashedRule';
import Glyph from '../components/base/Glyph';
import IconButton from '../components/base/IconButton';
import PhotoPlaceholder from '../components/base/PhotoPlaceholder';
import SectionLabel from '../components/base/SectionLabel';
import SegmentedControl from '../components/base/SegmentedControl';
import Switch from '../components/base/Switch';
import Text from '../components/base/Text';
import { formatDay } from '../constants/dates';
import { GEAR_CATEGORIES, GEAR_CATEGORY } from '../constants/gear';
import { gearFilter } from '../constants/search';
import { useDatabase } from '../data/DatabaseProvider';
import { deletePhoto, keepPhoto } from '../data/photos';
import { removeGear, setGearPhoto, updateGear } from '../data/repository';
import { requestPush, requestShell, requestNotice } from '../navigation';
import { color, dashed, icon, layout, shape, size, space, spacing, state } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 3e — the gear page (Design Round 15, 19c; was "Edit gear", minimal,
 * 2026-10-22). The bag page's shape (EditBagScreen), from a 3b row or a
 * search result.
 *
 * Header: compact, ‹ and the gear's name as the title (user data, 2 lines).
 * The "Cups logged" count is gone from it: the cup list carries it.
 * Body, top to bottom:
 *   status     the photo (the bag page's block, 2026-11-18): a square in 3c's
 *              slot frame that opens PhotoSheet, set at once outside the Save
 *              bar; beside it the sub line, category · added date ("Grinder ·
 *              added Apr 10": 3e must say what the gear is, Design Round 12,
 *              7), and with no photo 19c's "No photo yet. Tap to add one."
 *              3e's "Shows on every cup logged with this grinder" is not
 *              used: no cup shows its gear's photo. "Added on" stays in the
 *              sub line only, no Details row (Uryu, 2026-11-18).
 *   cups       every kind (19c drew a brewer or grinder only, Round 15 B5;
 *              a cup holds a kettle and a scale too since migration 14):
 *              ItemCups, "Cups with this grinder · N", 5 rows, "All N cups ›";
 *              none: "No cups with this grinder yet." and "Log a cup with it
 *              ›" (Log a cup with this gear preselected)
 *   details    "Details", then the card (2px border.container on raised): Name
 *              (required, BagForm's Field); Category, four chips, changeable
 *              only while no cup is logged with it — with cups they lock and
 *              "Logged on 2 cups as a grinder." says why; changing a default
 *              brewer's or grinder's category clears its default, said under
 *              the chips at once (Uryu, 2026-11-18); Maker ("Optional"); My
 *              settings note (NoteField), with a line saying what it is, not
 *              3e's grind prefill (drift D-81, T-11); for a brewer or grinder,
 *              under a dashed rule, "My default grinder" / "Preselected on
 *              every new cup." and the Switch (it turns off too: no default
 *              is a fair state; Uryu, 2026-10-22)
 *   end        "Remove from my gear" (3g's delete row; D-30 ink label) with
 *              "Frees 1 slot". It asks first in 11b's sheet (gaps.md 18;
 *              Design Round 12, 9). Back with 13b's notice. A removed
 *              default passes to nothing.
 * Not at this stage: the grind prefill from the note (V1.5, with the grind
 * field; todo.md T-11).
 * Save (19b's behaviour): SaveBar, absent until the first edit; reverting
 * takes it away. "Save changes", then "Applies to the N cups already logged
 * with it." when there are any. Saving stays on the page.
 * Leaving with edits asks first (DiscardSheet).
 */
const countFormat = new Intl.NumberFormat('en-US');
const CATEGORY_OPTIONS = GEAR_CATEGORIES.map((value) => ({ value, label: GEAR_CATEGORY[value] }));
// TODO(design): ours; 3e draws the grinder's note filled in, never empty.
const NOTE_PLACEHOLDER = {
  brewer: '3 pours, rinse the paper first…',
  grinder: '22 clicks for V60, 18 for AeroPress…',
  kettle: '92° for light roasts…',
  scale: 'Tare with the dripper on…',
};

export default function EditGearScreen({ gear, onBack, onRemoved, guardLeave }) {
  const db = useDatabase();
  // The gear as stored: the title and what counts as an edit.
  const [stored, setStored] = useState(gear);
  const [form, setForm] = useState({
    name: gear.name,
    maker: gear.maker ?? '',
    category: gear.category,
    note: gear.settings_note ?? '',
    isDefault: Boolean(gear.is_default),
  });
  const cupList = useFilteredCups(gearFilter(gear));
  const cups = cupList?.length ?? 0;
  const [photoSheet, setPhotoSheet] = useState(false);
  const [nameMissing, setNameMissing] = useState(false);
  // 'discard' | 'remove' | null
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  // The stored category names the page (sub-line, cups); the form's, the Details below.
  const kind = GEAR_CATEGORY[stored.category].toLowerCase();
  const formKind = GEAR_CATEGORY[form.category].toLowerCase();

  // Category changes only while no cup is logged with it ("has cups", not
  // "ever had": deleting them unlocks it; repository.ts updateGear). Locked
  // until the list has loaded, so it never flickers open.
  const categoryLocked = cupList == null || cups > 0;
  // The default is per category: a change takes it off, said at once.
  const defaultLost = Boolean(stored.is_default) && form.category !== stored.category;
  const pickCategory = (category) =>
    setForm((f) => ({ ...f, category, isDefault: category === stored.category ? Boolean(stored.is_default) : false }));

  const name = form.name.trim();
  const maker = form.maker.trim() || null;
  const note = form.note.trim() || null;
  // One per field that differs from what is stored: the Save bar counts them (32a).
  const changes = [
    name !== stored.name,
    maker !== (stored.maker ?? null),
    form.category !== stored.category,
    note !== (stored.settings_note ?? null),
    form.isDefault !== Boolean(stored.is_default),
  ].filter(Boolean).length;
  const dirty = changes > 0;
  useEffect(() => {
    guardLeave?.(dirty && !busy, () => {
      Keyboard.dismiss();
      setSheet('discard');
    });
  }, [guardLeave, dirty, busy]);
  const leave = () => onBack({ force: true });

  const save = async () => {
    if (busy || !dirty) return;
    if (!name) {
      setNameMissing(true);
      return;
    }
    setBusy(true);
    try {
      await updateGear(db, gear.id, { name, maker, category: form.category, settingsNote: note, isDefault: form.isDefault });
      Keyboard.dismiss();
      setStored((g) => ({ ...g, name, maker, category: form.category, settings_note: note, is_default: form.isDefault ? 1 : 0 }));
      setForm((f) => ({ ...f, name, maker: maker ?? '', note: note ?? '' }));
      // The Save bar slides away; this says it worked (Uryu, 2026-11-12: Save gave no feedback). 13b's notice, verb ours.
      requestNotice({ name, verb: 'saved' });
    } catch (error) {
      console.error('[3e] could not save', error);
      Alert.alert("Couldn't save your changes", String(error?.message ?? error));
    }
    setBusy(false);
  };

  // As the bag page's photo: set at once, outside the Save bar (the sheet's
  // "Use this photo" is its own confirm); the replaced photo's files go.
  const changePhoto = async (next) => {
    setPhotoSheet(false);
    try {
      if (next) await keepPhoto(next.id);
      const before = await setGearPhoto(db, stored.id, next?.id ?? null);
      deletePhoto(before);
      setStored((g) => ({ ...g, photo_uri: next?.id ?? null }));
    } catch (error) {
      if (next) deletePhoto(next.id);
      console.error('[3e] could not change the photo', error);
      Alert.alert("The photo wasn't changed", String(error?.message ?? error));
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await removeGear(db, gear.id);
      setSheet(null);
      onRemoved(stored.name);
    } catch (error) {
      console.error('[3e] could not remove', error);
      Alert.alert("Couldn't remove this gear", String(error?.message ?? error));
      setBusy(false);
    }
  };

  const cupsWord = cups === 1 ? 'cup' : `${countFormat.format(cups)} cups`;
  return (
    <View style={styles.screen}>
      <View style={styles.page}>
        <ScreenFrame scroll compact userTitle title={stored.name} leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}>
          <View style={styles.body}>
            <View style={styles.status}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setPhotoSheet(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={stored.photo_uri ? `${GEAR_CATEGORY[stored.category]} photo, change or remove` : `Add a photo of the ${kind}`}>
                {({ pressed }) => (
                  <View style={styles.photoFrame}>
                    <PhotoPlaceholder size={size.thumbnail.list - 2 * shape.borderWidth.box} photo={stored.photo_uri} />
                    {pressed ? <View style={styles.photoPressed} /> : null}
                  </View>
                )}
              </Pressable>
              <View style={styles.statusText}>
                <Text variant="bodySm" color="secondary">
                  {`${GEAR_CATEGORY[stored.category]} · added ${formatDay(gear.added_at)}`}
                </Text>
                {stored.photo_uri ? null : (
                  <Text variant="bodySm" color="muted">
                    No photo yet. Tap to add one.
                  </Text>
                )}
              </View>
            </View>

            {cupList ? (
              <ItemCups
                cups={cupList}
                heading={`Cups with this ${kind}`}
                emptyLine={`No cups with this ${kind} yet.`}
                logLabel="Log a cup with it"
                onLog={() => requestShell({ record: { [gear.category]: stored } })}
                onOpen={(id) => requestPush({ name: 'cup', id })}
                onAll={() => requestPush({ name: 'search', filter: gearFilter(stored) })}
              />
            ) : null}

            <View style={styles.details}>
              <SectionLabel variant="plain" label="Details" />
              <View style={styles.card}>
                <Field
                  label="Name"
                  value={form.name}
                  placeholder={GEAR_CATEGORY[gear.category]}
                  onChangeText={(next) => {
                    if (next.trim()) setNameMissing(false);
                    setForm((f) => ({ ...f, name: next }));
                  }}
                  error={nameMissing}
                />
                <View style={styles.block}>
                  <Text variant="labelEyebrow" color="muted">
                    Category
                  </Text>
                  <SegmentedControl compact options={CATEGORY_OPTIONS} value={form.category} onChange={pickCategory} disabled={categoryLocked} />
                  {categoryLocked && cups > 0 ? (
                    <Text variant="bodySm" color="secondary">
                      {`Logged on ${cups === 1 ? '1 cup' : `${countFormat.format(cups)} cups`} as a ${kind}.`}
                    </Text>
                  ) : null}
                  {defaultLost ? (
                    <Text variant="bodySm" color="secondary">
                      {`It stops being your default ${kind}: new cups start without one until you pick another.`}
                    </Text>
                  ) : null}
                </View>
                <Field label="Maker" value={form.maker} placeholder="Optional" onChangeText={(next) => setForm((f) => ({ ...f, maker: next }))} />
                <View style={styles.block}>
                  <Text variant="labelEyebrow" color="muted">
                    My settings note
                  </Text>
                  <NoteField
                    value={form.note}
                    onChangeText={(next) => setForm((f) => ({ ...f, note: next }))}
                    placeholder={NOTE_PLACEHOLDER[form.category]}
                    accessibilityLabel="My settings note"
                  />
                  {/* Drift D-81: what the note is. 3e's "Prefills the grind field…" returns with the grind field (V1.5, T-11). */}
                  <Text variant="bodySm" color="secondary">
                    {`Your settings for this ${formKind}, to look up before you brew.`}
                  </Text>
                </View>
                <DashedRule token={dashed.dividerSoft} />
                <View style={styles.defaultRow}>
                  <View style={styles.defaultText}>
                    <Text variant="label" color="primary">
                      {`My default ${formKind}`}
                    </Text>
                    <Text variant="bodySm" color="secondary">
                      Preselected on every new cup.
                    </Text>
                  </View>
                  <Switch
                    value={form.isDefault}
                    onValueChange={(isDefault) => setForm((f) => ({ ...f, isDefault }))}
                    accessibilityLabel={`My default ${formKind}`}
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setSheet('remove');
              }}
              accessibilityRole="button"
              accessibilityHint="Frees 1 slot"
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
              {/* 3e: the bin (3e draws 17, icon.md is 18) before the label; both
                  in color.text.destructive (Design Round 24). */}
              <View style={styles.removeLabel}>
                <Glyph name="trash" token={icon.md} color={color.icon.destructive} />
                <Text variant="labelCaps" color="destructive">
                  Remove from my gear
                </Text>
              </View>
              <Text variant="bodySm" color="muted">
                Frees 1 slot
              </Text>
            </Pressable>
          </View>
        </ScreenFrame>
      </View>

      <SaveBar changes={changes} onSave={save} note={cups > 0 ? `Applies to the ${cupsWord} already logged with it.` : null} />

      <PhotoSheet
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        onChosen={changePhoto}
        onRemove={stored.photo_uri ? () => changePhoto(null) : undefined}
      />
      <DiscardSheet
        visible={sheet === 'discard'}
        onClose={() => setSheet(null)}
        body={`Your edits to this ${kind} won't be saved. It stays as it was.`}
        onDiscard={() => {
          setSheet(null);
          leave();
        }}
      />
      {/* gaps.md 18: 11b's sheet, as 3g's delete. */}
      <BottomSheet visible={sheet === 'remove'} onClose={() => setSheet(null)} swipeToClose>
        <Text variant="displaySm" color="primary">
          {`Remove this ${kind}?`}
        </Text>
        <Text variant="body" color="secondary">
          {cups > 0
            ? `It's removed from My gear for good. Your ${cups === 1 ? 'logged cup keeps' : `${countFormat.format(cups)} logged cups keep`} its name.`
            : "It's removed from My gear for good."}
        </Text>
        {stored.is_default ? (
          <Text variant="body" color="secondary">
            {`It's your default ${kind}. New cups start without one until you pick another.`}
          </Text>
        ) : null}
        <View style={styles.sheetActions}>
          <Button variant="secondary" destructive label="Remove from my gear" onPress={remove} />
          <Button variant="secondary" label="Keep it" onPress={() => setSheet(null)} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  body: {
    gap: space[20],
    // Room under Remove, off the home indicator (as 2c, 3f).
    paddingBottom: layout.empty.block,
  },
  details: {
    gap: spacing.gap.row,
  },
  // The bag page's status block (EditBagScreen): the photo in 3c's slot
  // frame, then the sub-line and the no-photo line.
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[14],
  },
  photoFrame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
  },
  photoPressed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: state.pressed.row,
  },
  statusText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.gap.row,
  },
  // A labelled block in the card that isn't a Field (Category, the note).
  block: {
    gap: spacing.gap.row,
  },
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: spacing.gap.section,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[14],
  },
  defaultText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.gap.tight,
  },
  // 3e: the remove row, the weak 1.5 frame (as 3g's delete).
  remove: {
    borderWidth: shape.borderWidth.weak,
    borderColor: color.border.muted,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
  },
  removeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  pressed: {
    backgroundColor: state.pressed.surface,
  },
  sheetActions: {
    marginTop: space[8],
    gap: spacing.gap.section,
  },
});
