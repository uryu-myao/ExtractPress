import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import Badge from '../components/base/Badge';
import DashedRule from '../components/base/DashedRule';
import Chevron from '../components/base/Chevron';
import MenuRow from '../components/base/MenuRow';
import Text from '../components/base/Text';
import { GEAR_LIMIT } from '../constants/gear';
import { daysBetween } from '../constants/dates';
import { PRIVACY_POLICY_URL } from '../constants/links';
import { TASTE_AXES } from '../constants/tasteAxes';
import { useDatabase } from '../data/DatabaseProvider';
import { shareBackup, shareCupsCsv } from '../data/export';
import { OPEN_BAG_LIMIT, countGear, countOpenBags, countOwnRecords, loadDnaPage, loadProfile, onCupsChanged, onShelfChanged } from '../data/repository';
import { bandOf } from '../data/tasteDna';
import { requestPush, requestResetDna, requestRestore } from '../navigation';
import { color, dashed, layout, shape, space, spacing, state } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';
import { cupsLabel, dnaSummary, shiftedLabel } from './TasteDnaScreen';

/**
 * 6a — Profile, the upper part (2026-10-21), then 6b's and 6c's blocks as
 * far as V1 has them (scope settled 2026-11-09): 6b's Taste DNA and My data,
 * 6c's Legal and version line. Not built (drift.md): 6b's How adventurous,
 * Backup and Account; 6c's App, Help & feedback, Support us and Terms of use.
 *
 *   header       "Extract Press" over "My profile" (6a's "Morecoffee": the
 *                app was renamed 2026-11-08). 6a's "Edit" leads to 6d (Edit
 *                profile), not built: not shown.
 *   card         the personal card without its identity row: 6d holds the
 *                name and avatar, and the "Home brewer" badge has no rule
 *                (Design Round 11, D2). What V1 has: "Logging since ‹month› ·
 *                N weeks" (the first cup) over Cups / Bags / Cafés.
 *                Bags and Cafés: Home's counts (loadProfile), Cafés ink
 *                like the other two. Cafés replaced the
 *                Week streak (Design Round 21 build questions, 7: a streak
 *                counts what you missed; "Logging since" already says how
 *                long).
 *   Taste DNA    a link to 8f, the whole card (6a; Design Round 11, C: the
 *                one framed block that is pressable). Its stamp is a plain
 *                Badge, no ⓘ, no tap of its own: no button in a button
 *                (Design Round 8). Under the heading, the summary line
 *                (dnaSummary, Round 10, D12) at display.sm: 6a draws it 27,
 *                which has no style; display.xs (24) read too small on
 *                device (Uryu, 2026-10-23). Then the band
 *                names 8f uses, one per noted axis, as Badges (Round 11, D6),
 *                and "Built from N cups · last shifted N days ago".
 *   My shelf     My gear "N of 8" (6a's "of 3" contradicts 3a / 4a, gaps.md
 *                24) and My beans "N of 5" → Gear & beans (17c / 17d,
 *                Round 14) on that side
 *                (every bag on the shelf, opened or not: "On the shelf",
 *                Design Round 7, 18; no "1 stale": staleness isn't built).
 *                The heading holds gear and beans only, which "shelf" means
 *                (§1 Words). 6a's My words row is not built, and gets no
 *                heading of its own (Round 11, D1's "when 8h comes"): 8h is
 *                not built (2026-10-31).
 *   Taste DNA    6b's section with only "How my DNA is built" (6b's row and
 *                glyph) → 8g (2026-10-30; Design Round 17, A4: OK). "How
 *                adventurous" is not shown (drift D-70): V1's Try next has
 *                nothing for it to steer.
 *   My data      6b's two rows (2026-10-28): "Export my cups", the cups as
 *                CSV ("N cups as CSV, notes included", 6b's line), and in
 *                the Backup row's place "Export everything" / "Cups, bags
 *                and gear, as JSON" (Design Round 16, B8: "Back up" would
 *                promise a restore that doesn't exist). INTERIM (todo.md
 *                T-8): 6b's Backup saves by itself; this is a manual export
 *                until it is built.
 *                The CSV row stays beside Export everything (Uryu,
 *                2026-11-09; 25e has it again since Design Round 25, C1):
 *                the CSV is for reading, the zip is for putting back.
 *                6b's Backup row is not shown: V1 has no automatic backup,
 *                so it would lead nowhere (drift.md).
 *                Reset my taste DNA closes the block, where 6b and 25e draw
 *                it: red label and glyph (Design Round 24), Round 12's line
 *                (both boards since Round 25, B1). It asks first
 *                (ResetDnaSheet), so no chevron: a sheet, not a screen.
 *   Legal        6c's last block (2026-11-09). Privacy policy opens its page
 *                in the browser, shown only once constants/links.js has its
 *                URL (todo.md T-18). Licences → its page (LicencesScreen).
 *                Terms of use is not built: with no terms of our own, Apple's
 *                standard EULA applies (drift.md). 6c's other blocks (App,
 *                Help & feedback, Support us) are out of V1.
 *   version      6c's line under Legal: "Extract Press 1.0.0 (1)", the
 *                version and the build number from app.json (ios.buildNumber),
 *                the pair App Store Connect shows, so a report can be matched
 *                to an upload. 6c's "(2026.09)" is a date. 6c draws 11 / 500,
 *                which has no style: bodySm (12 / 500; drift.md).
 *
 * Each section: label.eyebrow heading (muted) over a 2px frame on raised
 * (border.container: quiet, Design Round 22, 24b; the chevrons say "opens");
 * rows are MenuRow.
 * Pressable blocks follow Design Round 11, C (todo.md T-10): MenuRow's rows
 * end in the shared chevron; the Taste DNA card is the app's one framed
 * block that is pressable (chevron on its heading line, the pressed fill
 * inside the frame).
 */
const sinceFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

function sinceLine(first, now) {
  const weeks = Math.floor(daysBetween(first, now) / 7);
  const since = `Logging since ${sinceFormat.format(new Date(first))}`;
  return weeks > 0 ? `${since} · ${weeks === 1 ? '1 week' : `${weeks} weeks`}` : since;
}

/** "Extract Press 1.0.0 (1)"; a missing part is left out. */
function versionLine(config) {
  const build = config?.ios?.buildNumber;
  return ['Extract Press', config?.version, build ? `(${build})` : null].filter(Boolean).join(' ');
}

function Stat({ value, label, first = false }) {
  return (
    <View style={[styles.stat, !first && styles.statDivided]} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="displaySm" color="primary">
        {String(value)}
      </Text>
      <Text variant="labelEyebrow" color="muted">
        {label}
      </Text>
    </View>
  );
}

function PersonalCard({ profile, now }) {
  const first = profile.cupTimes[0];
  return (
    <View style={styles.frame}>
      {first != null ? (
        <>
          <View style={styles.since}>
            <Text variant="bodySm" color="muted">
              {sinceLine(first, now)}
            </Text>
          </View>
          <DashedRule token={dashed.dividerSoft} />
        </>
      ) : null}
      <View style={styles.stats}>
        <Stat first value={profile.cupTimes.length} label="Cups" />
        <Stat value={profile.bags} label="Bags" />
        <Stat value={profile.cafes} label="Cafés" />
      </View>
    </View>
  );
}

function DnaLink({ dna, shift }) {
  const bands = TASTE_AXES.filter((a) => dna.axes[a.key].value != null).map((a) => a.steps[bandOf(dna.axes[a.key].value)]);
  const stamp = dna.state === 'none' ? null : dna.state === 'locked' ? 'Locked in' : 'Early signs';
  const summary = dnaSummary(dna);
  const meta = [`Built from ${cupsLabel(dna.cups)}`, shift ? `last ${shiftedLabel(shift.at)}` : null].filter(Boolean).join(' · ');
  // Round 11, C: the one framed block that is pressable. The frame is the
  // View, so the pressed fill (state.pressed.row, laid over raised) stays
  // inside it.
  return (
    <View style={styles.frame}>
      <Pressable
        onPress={() => requestPush({ name: 'dna' })}
        accessibilityRole="button"
        accessibilityLabel={['My taste DNA', stamp, summary, bands.join(', '), meta].filter(Boolean).join(', ')}
        style={({ pressed }) => [styles.dna, pressed && styles.rowPressed]}>
        <View style={styles.dnaHead}>
          <Text variant="labelEyebrow" color="muted">
            My taste DNA
          </Text>
          {stamp ? <Badge label={stamp} tone={dna.state === 'locked' ? 'selected' : 'accent'} placement="standalone" /> : null}
          <View style={styles.chevron}>
            <Chevron />
          </View>
        </View>
        {summary ? (
          <Text variant="displaySm" color="primary">
            {summary}
          </Text>
        ) : null}
        {bands.length ? (
          <>
            <DashedRule token={dashed.dividerSoft} />
            <View style={styles.bands}>
              {bands.map((b) => (
                <Badge key={b} label={b} tone="neutral" placement="standalone" />
              ))}
            </View>
          </>
        ) : null}
        <Text variant="bodySm" color="secondary">
          {meta}
        </Text>
      </Pressable>
    </View>
  );
}

function Section({ title, caption, children }) {
  return (
    <View style={styles.section}>
      <Text variant="labelEyebrow" color="muted" accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.frame}>{children}</View>
      {caption ? (
        <Text variant="bodySm" color="secondary">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProfileTabScreen() {
  const db = useDatabase();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () =>
      Promise.all([loadProfile(db), loadDnaPage(db), countGear(db), countOpenBags(db), countOwnRecords(db)]).then(
        ([profile, page, gear, bags, own]) =>
          setData({ profile, page, gear, bags, empty: own.cups + own.bags + own.gear + own.places === 0, now: Date.now() }),
        (error) => console.error('[profile] could not read', error)
      );
    load();
    const offCups = onCupsChanged(load);
    const offShelf = onShelfChanged(load);
    return () => {
      offCups();
      offShelf();
    };
  }, [db]);

  // Failure copy is ours.
  const onExport = (share) => async () => {
    setBusy(true);
    try {
      await share(db);
    } catch (error) {
      console.error('[export] failed', error);
      Alert.alert("Couldn't export", String(error?.message ?? error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenFrame scroll eyebrow="Extract Press" title="My profile">
      {data ? (
        <View style={styles.body}>
          <PersonalCard profile={data.profile} now={data.now} />
          <DnaLink dna={data.page.dna} shift={data.page.shift} />
          <Section title="My shelf" caption="The shelf is what keeps a log down to 15 seconds.">
            <MenuRow icon="dripper" label="My gear" value={`${data.gear} of ${GEAR_LIMIT}`} onPress={() => requestPush({ name: 'shelf', side: 'gear' })} />
            <MenuRow icon="beanBag" label="My beans" value={`${data.bags} of ${OPEN_BAG_LIMIT}`} onPress={() => requestPush({ name: 'shelf', side: 'beans' })} />
          </Section>
          <Section title="Taste DNA">
            <MenuRow icon="asterisk" label="How my DNA is built" onPress={() => requestPush({ name: 'dnaBuilt' })} />
          </Section>
          {/* Restore only on an empty app (Design Round 23, 25e): the row while it
              can work, then a sentence under the block instead, not a dead row. */}
          <Section title="My data" caption={data.empty ? undefined : 'Restoring a backup works on an empty app only.'}>
            <MenuRow
              icon="download"
              label="Export my cups"
              sub={`${cupsLabel(data.profile.cupTimes.length)} as CSV, notes included`}
              onPress={onExport(shareCupsCsv)}
              disabled={busy}
            />
            {/* INTERIM (todo.md T-8): a manual export of everything in 6b's
                Backup row, until the real backup (Round 16, B8). Since
                2026-11-08 a zip with the photos, which Restore reads back.
                The sub line is Design's (Round 23, 25e). */}
            <MenuRow icon="download" label="Export everything" sub="Cups, bags, gear and photos" onPress={onExport(shareBackup)} disabled={busy} />
            {data.empty ? <MenuRow icon="restore" label="Restore from a backup" sub="From an Export everything file" onPress={requestRestore} disabled={busy} /> : null}
            <MenuRow icon="reset" destructive chevron={false} label="Reset my taste DNA" sub="Counts from today. Older cups stay in Records." onPress={requestResetDna} disabled={busy} />
          </Section>
          <Section title="Legal">
            {PRIVACY_POLICY_URL ? <MenuRow icon="shield" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} /> : null}
            <MenuRow icon="licences" label="Licences" onPress={() => requestPush({ name: 'licences' })} />
          </Section>
          <Text variant="bodySm" color="muted" style={styles.version}>
            {versionLine(Constants.expoConfig)}
          </Text>
        </View>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space[20],
    // Room under the last block; the pager already ends at the bar's band
    // (Design Round 23: the band plus space.20).
    paddingBottom: space[20],
  },
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  rowPressed: {
    backgroundColor: state.pressed.row,
  },
  since: {
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.gap.tight,
    paddingVertical: space[14],
    paddingHorizontal: space[8],
  },
  statDivided: {
    borderLeftWidth: shape.borderWidth.divider,
    borderLeftColor: color.border.subtle,
  },
  dna: {
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: spacing.gap.section,
  },
  dnaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  chevron: {
    marginLeft: 'auto',
  },
  bands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap.row,
  },
  section: {
    gap: spacing.gap.row,
  },
  version: {
    textAlign: 'center',
  },
});
