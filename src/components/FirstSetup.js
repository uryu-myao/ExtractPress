import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useDatabase } from '../data/DatabaseProvider';
import { countOwnRecords, getSetupStep, isSetupDone, markSetupDone, onShelfChanged, setSetupStep } from '../data/repository';
import { onFirstSetupRequest, requestShell } from '../navigation';
import AddBagScreen from '../screens/AddBagScreen';
import AddGearScreen from '../screens/AddGearScreen';
import { ScreenBackdropContext } from '../screens/ScreenFrame';
import WelcomeScreen from '../screens/WelcomeScreen';
import { color } from '../theme/tokens';
import GrainTexture from './base/GrainTexture';
import PushedScreen from './PushedScreen';

/**
 * First setup (Design Round 30, 36a–36e; built 2026-11-21), over the whole
 * app while settings.setup_done is 0. Welcome is the base; the two steps are
 * pushed over it, so Back and the edge swipe go back a step as everywhere.
 * Gear first, then the bag, as the boards draw it (Uryu, 2026-11-28, on
 * the Planner's case: the camera step is the heavier one and comes second;
 * gear is set once, bags keep coming; with the bag last it needs no Skip
 * setup. Was beans first from 2026-11-21).
 *
 *   Welcome  Set up my shelf → gear · Skip setup → Home ·
 *            New phone? Restore a backup (only while the app is empty)
 *   gear     Next → bag · Skip setup (top right, 36e) → Home · Back → Welcome
 *   bag      Open this bag / Add without opening / I'll add a bag later →
 *            Home · Back → gear (no Skip setup on the last step, 40a)
 *
 * setup_done becomes 1 on every way out (36e "For Code"): Done, Skip setup,
 * or a restore (backupFormat.ts copyInto writes it; the shelf's change
 * signal tells this host to leave, and Restore's "All back." sheet stays
 * over Home). Never shown again: skipping is a choice, and both steps are
 * ordinary screens in the app.
 *
 * Quitting mid-setup is not a way out (Round 30 A3): reaching the bag step
 * stores it (device.setup_step), and a relaunch opens there, the gear step
 * under it for Back.
 *
 * Left out on purpose (Uryu, 2026-11-21): 8n "How do you take your coffee?"
 * and 8c's "I mostly drink out". Nothing reads coffee_style or drinks_out in
 * V1, so both stay NULL (schema.ts). No permission is asked here:
 * notifications at 8i's switch, the camera when a photo is taken.
 *
 * Mounted after ShellStack and before RestoreHost (AppShell), so Restore's
 * sheets open over Welcome.
 */
const STEPS = 2;
const stepLabel = (n) => `Setup · ${n} of ${STEPS}`;

export function FirstSetupHost() {
  const db = useDatabase();
  // undefined: not read yet (the ground covers the app, so Home doesn't
  // flash first); null: setup done; true: showing.
  const [open, setOpen] = useState(undefined);
  // The pushed steps over Welcome: { name: 'gear' | 'bag', key }.
  const [stack, setStack] = useState([]);
  // Welcome's restore row: only while the app is empty (Round 30 A2).
  const [empty, setEmpty] = useState(false);
  const nextKey = useRef(0);
  const entry = (name) => ({ name, key: (nextKey.current += 1) });

  useEffect(() => {
    let alive = true;
    Promise.all([isSetupDone(db), getSetupStep(db)]).then(
      ([done, step]) => {
        if (!alive) return;
        if (!done && step === 'bag') setStack([entry('gear'), entry('bag')]);
        setOpen(done ? null : true);
      },
      (error) => {
        // Setup can't be read: let the app open rather than block it.
        console.error('[setup] could not read setup_done', error);
        if (alive) setOpen(null);
      }
    );
    return () => {
      alive = false;
    };
  }, [db]);

  // Development: Profile's dev row shows it again, from Welcome.
  useEffect(
    () =>
      onFirstSetupRequest(() => {
        setStack([]);
        setOpen(true);
      }),
    []
  );

  // While showing: whether the app is empty (the restore row), and whether a
  // restore from Welcome marked setup done (copyInto), then leave. A bag or
  // gear saved by the steps signals too, with setup_done still 0.
  useEffect(() => {
    if (!open) return undefined;
    const check = () =>
      Promise.all([isSetupDone(db), countOwnRecords(db)]).then(
        ([done, own]) => {
          setEmpty(own.cups + own.bags + own.gear + own.places === 0);
          if (!done) return;
          setStack([]);
          setOpen(null);
        },
        (error) => console.error('[setup] could not read', error)
      );
    check();
    return onShelfChanged(check);
  }, [db, open]);

  const push = (name) => setStack((s) => (s.some((e) => e.name === name && !e.leaving) ? s : [...s, entry(name)]));
  const leaving = (key) => setStack((s) => s.map((e) => (e.key === key ? { ...e, leaving: true } : e)));
  const popKey = (key) => setStack((s) => s.filter((e) => e.key !== key));

  const toBag = () => {
    // Gear's search may have had the keyboard; the bag step opens without it.
    Keyboard.dismiss();
    setSetupStep(db, 'bag').catch((error) => console.error('[setup] could not keep the step', error));
    push('bag');
  };

  const finish = async () => {
    try {
      await markSetupDone(db);
    } catch (error) {
      // Only costs Welcome showing again next launch; the shelf is saved.
      console.error('[setup] could not mark setup done', error);
    }
    setStack([]);
    setOpen(null);
    requestShell({ tab: 'home' });
  };

  if (open === null) return null;
  if (open === undefined) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.cover]}>
        <GrainTexture />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.cover]}>
      <WelcomeScreen onSetUp={() => push('gear')} onSkip={finish} restore={empty} />
      <ScreenBackdropContext.Provider value={false}>
        {stack.map((e) => (
          <PushedScreen key={e.key} onLeave={() => leaving(e.key)} onBack={() => popKey(e.key)}>
            {(goBack, guardLeave) =>
              e.name === 'gear' ? (
                <AddGearScreen guardLeave={guardLeave} onBack={goBack} setup={{ step: stepLabel(1), onNext: toBag, onSkip: finish }} />
              ) : (
                <AddBagScreen
                  guardLeave={guardLeave}
                  onBack={(options) => {
                    // Back to the gear step: a relaunch starts there too.
                    setSetupStep(db, null).catch(() => {});
                    goBack(options);
                  }}
                  onAdded={finish}
                  setup={{ step: stepLabel(2), onLater: finish }}
                />
              )
            }
          </PushedScreen>
        ))}
      </ScreenBackdropContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: color.surface.ground,
  },
});
