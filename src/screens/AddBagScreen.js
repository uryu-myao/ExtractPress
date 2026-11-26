import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { useBagFacts } from '../components/BagFacts';
import BagForm from '../components/BagForm';
import BagLift from '../components/BagLift';
import DateSheet from '../components/DateSheet';
import DiscardSheet from '../components/DiscardSheet';
import PhotoSheet, { usePhotoPick } from '../components/PhotoSheet';
import Badge from '../components/base/Badge';
import Button from '../components/base/Button';
import DetailRow from '../components/base/DetailRow';
import IconButton from '../components/base/IconButton';
import Text from '../components/base/Text';
import TextLink from '../components/base/TextLink';
import { useRecordDraftIfAny } from '../components/RecordDraft';
import { useDatabase } from '../data/DatabaseProvider';
import { deletePhoto, dropPhoto, keepPhoto, liftPhoto, makeCutouts } from '../data/photos';
import { formatDay, startOfDay } from '../constants/dates';
import { OPEN_BAG_LIMIT, countCups, countOpenBags, getBagDateKind, insertBag, setBagDateKind } from '../data/repository';
import { resolveTextStyle } from '../theme/fonts';
import { color, component, icon, shape, space, spacing, state, textStyle } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 3c — "Add a bag": the bag page (37f) before it's filled (Design Turn 37,
 * 38a–38c; decided 2026-11-25). Pushed from 5a's "Add a bag" row inside the
 * Record sheet, from Home's shelf and from 3d.
 *
 *   top     ScreenFrame's hero, as the bag page: the visual on the dots
 *           (BagLift). Before a photo, the footprint is dashed and holds
 *           Take a photo and Choose from Photos (38a; no sheet). After the
 *           shot or the pick the page plays the lift (38b): it is the
 *           confirmation, there is no confirm step. Lift failed: the print,
 *           "Couldn't lift it out · kept the photo" (38c). Once it settles,
 *           the camera button (37m) fades in top right: the Bag photo sheet
 *           (Retake photo / Choose from Photos / Remove photo); removing
 *           brings the footprint back
 *   header  ‹ and "Add a bag" in titleCaps (as every pushed page's title;
 *           38a draws an eyebrow; Uryu, 2026-11-26), floating at the safe
 *           top like 37f's buttons. No "N / 5 on the shelf": the footer says it
 *   name    the title: a serif-40 field, "Bean name", a blue caret and a
 *           1.5 line under it; then Roaster, its own field (label, Optional
 *           tag, value line; revised 2026-11-26)
 *   body    "About the coffee" with one Optional tag: Roast level, Origin,
 *           Region, Process and Date on the bag, rows of 52 in one quiet
 *           frame
 *   footer  as built: Open this bag (off until there's a name), Add without
 *           opening, "N of 5 slots free. Finish a bag to free one up."
 *
 * The lift runs on the pending photo (photos.ts liftPhoto) as soon as it is
 * in; Add keeps the photo with its cutouts and stores the code it gave, so
 * the shelf shows the cutout at once. Leaving without adding drops both.
 *
 * "Open this bag" stores the bag, opened now, makes it the cup's bag and goes
 * back to 5a. "Add without opening" stores it unopened (it takes a slot; 3d
 * opens it later). onAdded, when given, replaces Back after a save (Home →
 * 3d). The name is the only required field: Open this bag is off without
 * it; Add without opening, pressed without it, marks the name required
 * (5d's way). At 5 open bags both are off and the line under them says why
 * (3c's copy).
 *
 * First cup (Uryu, 2026-11-09): reached from the Record sheet before any
 * cup is logged, a line over the form says only the name is needed and the
 * rest can be changed later, so logging the first cup doesn't feel like a
 * long form. Body, text.secondary, over About the coffee. Copy and
 * placement are ours (not drawn; 38a has no place for it); TODO: Design to
 * confirm.
 */
/**
 * First setup's first step (Design Round 30, 36d; built 2026-11-21): this
 * screen with `setup` = { step, onLater, onSkip } and onAdded. Beans come
 * first, then gear, as everywhere in the app (My beans before My gear;
 * Uryu, 2026-11-21: 36c / 36d draw gear first). 8o is 3c in a setup mode:
 *   header  the standard header: ‹ (to Welcome) and "Skip setup" at the
 *           top right; "SETUP · 1 OF 2" (eyebrow) over the question as the
 *           title. No "2 / 5" stat and no "N of 5 slots free": here they
 *           can only read 0 / 5, a number that never changes
 *   body    8o's line, then 3c's form as it was before 38a (the bag form
 *           with its photo slot, which opens the Bag photo sheet); Turn 37
 *           doesn't redraw this step
 *   footer  "Open this bag" and "Add without opening" (Uryu, 2026-11-21:
 *           a bag bought ahead goes on the shelf too; 36d drops it), both
 *           off until there is a name (36d), then "I'll add a bag later"
 *           space[8] under them, centred. All three go on to gear. Only the
 *           opened bag fills 5a's Bag.
 *   keyboard  not up on arrival (Uryu, 2026-11-21): Bean name isn't focused
 * 36d's question title is serif 34 / 36; ours is display.lg (40 / 41), the
 * token the standard header has.
 */
/**
 * Leaving with something entered asks first (Uryu, 2026-11-26; Round 4's
 * discard sheet, as 3g): a name or roaster other than the prefill, a
 * photo, a fact or the date. ‹ asks here; the edge swipe asks through
 * guardLeave (PushedScreen's, or the Record sheet's second page). After an
 * add the screen leaves with { force: true }.
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

export default function AddBagScreen({ onBack, onAdded, prefill, setup, guardLeave }) {
  const db = useDatabase();
  // In the Record sheet the new bag becomes the cup's bag; from 3d it just joins the shelf.
  const chooseBag = useRecordDraftIfAny()?.chooseBag;
  const [form, setForm] = useState({ name: prefill?.name ?? '', roaster: prefill?.roaster ?? '', process: null, roastLevel: null, origin: null, region: null });
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
  // Roast level, Origin, Region, Process: rows in the form under Roaster, written on add.
  const about = useBagFacts({
    value: { roastLevel: form.roastLevel, origin: form.origin, region: form.region, process: form.process },
    onChange: (patch) => setForm((f) => ({ ...f, ...patch })),
    framed: !setup,
  });
  // A prepared photo (data/photos.ts), not kept until the bag is added.
  const [photo, setPhoto] = useState(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const pending = useRef(null);
  pending.current = photo;
  useEffect(() => () => pending.current && dropPhoto(pending.current.id), []);
  // Its lift (photos.ts Lift): undefined while Vision works. lifting: the
  // run, awaited before the photo is kept (its files are being written).
  const [lift, setLift] = useState(undefined);
  const lifting = useRef(null);
  // The lift has settled: the camera button shows (38b, step 4).
  const [settled, setSettled] = useState(false);
  const cameraIn = useRef(new Animated.Value(0)).current;

  // A new photo, from the footprint or the sheet: the old one goes, the lift starts.
  const takePhoto = (next) => {
    if (pending.current) dropPhoto(pending.current.id);
    pending.current = next;
    setPhoto(next);
    setPhotoSheet(false);
    setLift(undefined);
    setSettled(false);
    cameraIn.setValue(0);
    // Setup's form has no visual: its cutout is made after Add (makeCutouts).
    if (setup) {
      lifting.current = null;
      return;
    }
    const run = liftPhoto(next).then(
      (result) => result,
      (error) => {
        console.warn('[bag] lift failed', error);
        return { code: null, uri: null };
      }
    );
    lifting.current = run;
    run.then((result) => {
      if (pending.current?.id === next.id) setLift(result);
    });
  };
  const removePhoto = () => {
    if (pending.current) dropPhoto(pending.current.id);
    pending.current = null;
    lifting.current = null;
    setPhoto(null);
    setLift(undefined);
    setSettled(false);
    cameraIn.setValue(0);
  };
  const { step: photoStep, pick, camera } = usePhotoPick({ guide: 'bag', onChosen: takePhoto });

  useEffect(() => {
    let alive = true;
    countOpenBags(db).then((n) => alive && setOpen(n), () => alive && setOpen(0));
    getBagDateKind(db).then((kind) => alive && setBagDate((d) => ({ ...d, kind })), () => {});
    if (chooseBag) countCups(db).then((n) => alive && setFirstCup(n === 0), () => {});
    return () => {
      alive = false;
    };
  }, [db, chooseBag]);

  // Anything entered (see the top): leaving asks first.
  const dirty =
    form.name !== (prefill?.name ?? '') ||
    form.roaster !== (prefill?.roaster ?? '') ||
    photo != null ||
    form.process != null ||
    form.roastLevel != null ||
    form.origin != null ||
    form.region != null ||
    bagDate.value != null;
  const [discarding, setDiscarding] = useState(false);
  const askDiscard = () => {
    Keyboard.dismiss();
    setDiscarding(true);
  };
  useEffect(() => {
    guardLeave?.(dirty, askDiscard);
  }, [guardLeave, dirty]); // eslint-disable-line react-hooks/exhaustive-deps
  const back = () => (dirty ? askDiscard() : onBack());

  const full = open != null && open >= OPEN_BAG_LIMIT;
  const free = open == null ? null : OPEN_BAG_LIMIT - open;
  const name = form.name.trim();

  const addBag = async (opened) => {
    if (!name) {
      setNameMissing(true);
      return;
    }
    let kept = null;
    let cutout = null;
    try {
      if (photo) {
        // Vision may still be writing the cutouts next to the photo.
        if (lifting.current) cutout = (await lifting.current).code;
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
        roastLevel: form.roastLevel,
        origin: form.origin,
        region: form.region,
        open: opened,
        photo: kept,
        photoCutout: cutout,
      });
      // Not lifted yet (setup, or Vision failed): made in the background (photos.ts); not awaited.
      if (kept && cutout == null) makeCutouts(db);
      // Only an opened bag can be the cup's bag.
      if (opened) chooseBag?.(bag);
      // Setup keeps this step under the gear step: Back from gear finds an
      // empty form, not the bag just added, ready to add again.
      if (setup) {
        setForm({ name: '', roaster: '', process: null, roastLevel: null, origin: null, region: null });
        setBagDate((d) => ({ ...d, value: null }));
        setPhoto(null);
      }
      guardLeave?.(false);
      if (onAdded) onAdded();
      else onBack({ force: true });
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

  // Off until there's a name (38a), and at 5 open bags. A press while off
  // warns (§1) and shows why: the line under the buttons (full), or the
  // name's required state.
  const off = full || open == null || !name;
  const warns = full || (open != null && !name);
  const showMissing = !name ? () => setNameMissing(true) : undefined;
  const footer = (
    <View style={styles.footer}>
      {/* The pair is gap.section apart, as Log a cup's Save / Add
          tasting note are; the line under them stays gap.row. */}
      <View style={styles.buttons}>
        <Button label="Open this bag" onPress={() => addBag(true)} disabled={off} warnWhenDisabled={warns} onDisabledPress={showMissing} />
        {/* Added, not opened (2026-10-12): it takes a slot and is opened
            later from 3d. Copy confirmed (Design's reply to brief 18).
            38a draws it on while Open this bag is off; pressed with no
            name, the name says it's required (5d's way). In setup both are
            off until there is a name (36d). */}
        <Button
          variant="secondary"
          label="Add without opening"
          onPress={() => addBag(false)}
          disabled={full || open == null || (setup && !name)}
          warnWhenDisabled={full || (setup && open != null && !name)}
          onDisabledPress={setup ? showMissing : undefined}
        />
      </View>
      {setup ? <TextLink centered label="I'll add a bag later" onPress={setup.onLater} /> : null}
      {free != null && !setup ? (
        <Text variant="bodySm" color="secondary" style={styles.slots}>
          {full ? 'No slots free. Finish a bag to free one up.' : `${free} of ${OPEN_BAG_LIMIT} slots free. Finish a bag to free one up.`}
        </Text>
      ) : null}
    </View>
  );

  const pickDate = () => {
    Keyboard.dismiss();
    setPicking(true);
  };
  const changeName = (text) => {
    // One line of text, wrapped by the field: a return ends the typing.
    const next = text.replace(/\n/g, '');
    if (next.trim()) setNameMissing(false);
    setForm((f) => ({ ...f, name: next }));
  };

  const sheets = (
    <>
      {about.sheets}
      {camera}
      <PhotoSheet
        guide="bag"
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        onChosen={takePhoto}
        onRemove={photo ? removePhoto : undefined}
        removeNote={setup ? undefined : null}
      />
      {/* Copy ours (TODO: Design): Round 4's sheet, its body for a bag not added yet. */}
      <DiscardSheet
        visible={discarding}
        onClose={() => setDiscarding(false)}
        body="This bag won't be added. What you entered isn't kept."
        onDiscard={() => {
          setDiscarding(false);
          guardLeave?.(false);
          onBack({ force: true });
        }}
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
    </>
  );

  // First setup (36d) keeps its own page: the question as the title, and
  // 3c's form with the photo slot. TODO(Design): 38a doesn't redraw setup's
  // bag step; it keeps 36d until it does (its photo now has no confirm step).
  if (setup) {
    return (
      <View style={styles.screen}>
        <ScreenFrame
          scroll
          eyebrow={setup.step}
          title="What's in your bag right now?"
          leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={back} />}
          leadingEnd={<TextLink label="Skip setup" onPress={setup.onSkip} />}
          footer={footer}>
          <Text variant="body" color="secondary" style={styles.intro}>
            Your first cup gets logged against it. Only the name is needed.
          </Text>
          <BagForm
            // Setup opens without the keyboard (Uryu, 2026-11-21): the step
            // reads first, and the name isn't the only thing it asks.
            autoFocusName={false}
            value={form}
            onChange={(next) => {
              if (next.name.trim()) setNameMissing(false);
              setForm(next);
            }}
            nameMissing={nameMissing}
            bagDate={{ kind: bagDate.kind, value: bagDate.value, picking, onPick: pickDate }}
            facts={about.rows}
            photo={{
              uri: photo?.uri ?? null,
              onPress: () => {
                Keyboard.dismiss();
                setPhotoSheet(true);
              },
            }}
          />
        </ScreenFrame>
        {sheets}
      </View>
    );
  }

  const dateShown = bagDate.value != null ? `${bagDate.kind === 'bestBefore' ? 'Best before' : 'Roasted'} ${formatDay(bagDate.value)}` : null;
  return (
    <View style={styles.screen}>
      <ScreenFrame
        hero={({ width, barLine }) => (
          <BagLift
            width={width}
            barLine={barLine}
            photo={photo}
            lift={lift}
            busy={photoStep === 'working'}
            onTake={() => {
              Keyboard.dismiss();
              pick('camera');
            }}
            onChoose={() => {
              Keyboard.dismiss();
              pick('library');
            }}
            onSettled={() => {
              setSettled(true);
              Animated.timing(cameraIn, { toValue: 1, duration: component.bagLift.time.ui, useNativeDriver: true }).start();
            }}
          />
        )}
        heroHeight={component.bagPage.visualHeight}
        // The bar's title, once scrolled past the visual.
        title={name || 'Add a bag'}
        titleSlot={
          <View>
            <NameField value={form.name} onChangeText={changeName} missing={nameMissing} />
            <RoasterField value={form.roaster} onChangeText={(roaster) => setForm((f) => ({ ...f, roaster }))} />
          </View>
        }
        leading={
          <View style={styles.leading}>
            <IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={back} />
            {/* titleCaps, as every pushed page's title beside ‹ (Uryu, 2026-11-26; 38a draws the eyebrow). */}
            <Text variant="titleCaps" color="primary" accessibilityRole="header">
              Add a bag
            </Text>
          </View>
        }
        trailing={
          photo && settled ? (
            <Animated.View style={{ opacity: cameraIn }}>
              <IconButton
                icon="photo"
                iconToken={icon.action}
                accessibilityLabel="Bag photo: retake, choose or remove"
                onPress={() => {
                  Keyboard.dismiss();
                  setPhotoSheet(true);
                }}
              />
            </Animated.View>
          ) : null
        }
        footer={footer}>
        {firstCup ? (
          <Text variant="body" color="secondary" style={styles.firstCup}>
            Just the name is needed for now. The rest can be added or changed any time in My beans.
          </Text>
        ) : null}
        <View style={styles.about}>
          {/* One Optional tag for the section (38a): it stays when rows are filled. */}
          <View style={styles.labelRow}>
            <Text variant="labelEyebrow" color="muted">
              About the coffee
            </Text>
            <Badge label="Optional" tone="optional" placement="tag" />
          </View>
          <View style={styles.aboutFrame}>
            {about.rows}
            <DetailRow label="Date on the bag" value={dateShown} framed onPress={pickDate} />
          </View>
        </View>
      </ScreenFrame>
      {sheets}
    </View>
  );
}

/**
 * Roaster, its own field (38a, revised 2026-11-26 on Uryu's comment: "Roaster ·
 * optional" in one line was easy to miss): "ROASTER" (eyebrow, muted) with
 * an Optional tag at the right, gone once there's a value; then a 40 line,
 * 16 / 600, "e.g. Kurasu, Blue Bottle", a 1.5 border.muted line under it
 * (ink while focused).
 */
function RoasterField({ value, onChangeText }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.roasterField}>
      <View style={styles.labelRow}>
        <Text variant="labelEyebrow" color="muted">
          Roaster
        </Text>
        {value ? null : <Badge label="Optional" tone="optional" placement="tag" />}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="e.g. Kurasu, Blue Bottle"
        placeholderTextColor={color.text.placeholder}
        selectionColor={color.caret}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Roaster, optional"
        style={[styles.roaster, focused && styles.lineFocused]}
      />
    </View>
  );
}

/**
 * The name as the page's title (38a): serif 40 (displayLg), "Bean name" in
 * text.placeholder, the blue caret, and a 1.5 border.muted line under it so
 * it reads as a field (ink while focused, the error colour when required,
 * as the bag form's fields). It wraps, as the bag page's title does; a return ends it.
 * Not focused on arrival (Uryu, 2026-11-26): the page opens without the
 * keyboard, on the photo and the fields.
 */
function NameField({ value, onChangeText, missing }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={missing ? 'Bean name · required' : 'Bean name'}
        placeholderTextColor={missing ? state.error.text : color.text.placeholder}
        selectionColor={color.caret}
        autoCorrect={false}
        multiline
        submitBehavior="blurAndSubmit"
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={missing ? 'Bean name, required' : 'Bean name'}
        style={styles.name}
      />
      <View style={[styles.nameRule, focused && styles.lineFocused, missing && styles.nameRuleError]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  name: {
    ...resolveTextStyle(textStyle.displayLg),
    color: color.text.primary,
    padding: 0,
  },
  nameRule: {
    marginTop: component.addBag.nameLine,
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.border.muted,
  },
  lineFocused: {
    borderTopColor: color.border.strong,
    borderBottomColor: color.border.strong,
  },
  nameRuleError: {
    borderTopColor: state.error.border,
  },
  roasterField: {
    marginTop: component.addBag.roasterTop,
    gap: component.addBag.labelGap,
  },
  roaster: {
    ...resolveTextStyle(textStyle.fieldValue),
    color: color.text.primary,
    height: component.addBag.roasterHeight,
    paddingVertical: 0,
    borderBottomWidth: shape.borderWidth.divider,
    borderBottomColor: color.border.muted,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  about: {
    gap: space[8],
  },
  // One quiet frame (38a): border.container, raised. The rows pad themselves (DetailRow framed), so a press fills the frame's width.
  aboutFrame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  footer: {
    gap: spacing.gap.row,
  },
  buttons: {
    gap: spacing.gap.section,
  },
  slots: {
    textAlign: 'center',
  },
  firstCup: {
    marginBottom: spacing.gap.section,
  },
  intro: {
    marginBottom: spacing.gap.section,
  },
});
