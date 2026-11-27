import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { color, component, dashed, icon } from '../theme/tokens';
import { pageGeometry } from './BagTile';
import Button from './base/Button';
import DotGround from './base/DotGround';
import Glyph from './base/Glyph';
import Text from './base/Text';

const page = component.bagPage;
const cfg = component.bagLift;
const T = cfg.time;
const ease = Easing.bezier(...cfg.ease);

const LIFTED = 'Lifted out · tap the camera to retake';
const NOT_LIFTED = "Couldn't lift it out · kept the photo";

/**
 * Add a bag's visual (Design Turn 37, 38a–38c; decided 2026-11-25): the bag
 * page's (BagVisual) before it's filled, measured the same way
 * (pageGeometry), so a bag lifted here stands where its page will show it.
 *
 *   no photo  the footprint, dashed (§8: not started), paper at 72 %, holding
 *             the camera, Take a photo and Choose from Photos (38a), and
 *             under it "Reads the label, so you can tap instead of type."
 *             (Turn 38), gone with it. No sheet
 *   the lift  (38b) the confirmation, played once a photo is in:
 *     1 shot    0–200: the photo lands, 3 : 4, fading in and scaling from 0.96
 *     2 pull    200–900: a paper line with an ink top edge runs down the
 *               photo; above it the photo is gone and the cutout under it,
 *               where it sat in the photo, shows on the dots
 *     3 lifted  900–1100: a paper halo round the cutout, in and out; a light
 *               haptic
 *     4 settled 1100–1500: the cutout eases into its place on the page
 *               (37i's rule, the bag page's: only the bottom snaps). Then
 *               onSettled (the camera button fades in) and "Lifted out · tap
 *               the camera to retake" for 2 s under the bag (as the failed
 *               line; Uryu, 2026-11-26)
 *   failed    (38c) the motion stops after step 1: the photo crossfades into
 *             the print (state b) and "Couldn't lift it out · kept the
 *             photo" shows once, over the visual's foot. No error colour
 *   Reduce Motion: a crossfade (200) from the photo to the settled cutout or
 *             the print. No line, no halo
 *
 * Waiting for Vision: the pull starts only once the lift is back, so a
 * failed one can still stop after step 1 (38c). Until then the line waits
 * on the photo's top edge, breathing (opacity 0.4 ↔ 1, 600). 38b holds it
 * at the bottom edge instead, after a pull that has nothing under it yet:
 * the visual would be empty dots, and a failure would have to bring the
 * photo back. TODO(Design): confirm the wait on the top edge.
 *
 * Props
 *   width, barLine  the hero's (ScreenFrame ctx)
 *   photo     the pending photo (photos.ts PendingPhoto) or null
 *   lift      undefined while Vision works; then photos.ts Lift (uri null:
 *             not lifted)
 *   busy      a photo is being prepared: the footprint's buttons are off
 *   onTake, onChoose  the footprint's two ways in
 *   onSettled the motion is over (the camera button may show)
 */
export default function BagLift({ width, barLine, photo, lift, busy, onTake, onChoose, onSettled }) {
  const reduceMotion = useReduceMotion();
  const height = page.visualHeight;
  const { f, place } = pageGeometry(width, barLine);
  // The shot: 3 : 4 in the area under the bar's line, its top on the line.
  const PH = (height - barLine) * cfg.photo.height;
  const PW = PH * cfg.photo.aspect;
  const shot = { x: (width - PW) / 2, y: barLine, w: PW, h: PH };

  // 'ghost' | 'shot' | 'wait' | 'pull' | 'done' | 'print'
  const [phase, setPhase] = useState(photo ? 'shot' : 'ghost');
  const [note, setNote] = useState(null);
  const run = useRef(0);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const v = useRef({
    photo: new Animated.Value(0), // the shot's opacity and scale (0 → 1)
    shown: new Animated.Value(1), // the shot fading out (Reduce Motion, failed)
    wipe: new Animated.Value(0), // the pull, 0 → 1 down the photo
    line: new Animated.Value(0), // the line's opacity
    result: new Animated.Value(0), // the cutout or the print
    halo: new Animated.Value(0),
    settle: new Animated.Value(0), // the cutout from where it sat to its place
    note: new Animated.Value(0),
  }).current;
  const breath = useRef(null);
  const buzz = useRef(null);

  const stopAll = () => {
    breath.current?.stop();
    breath.current = null;
    clearTimeout(buzz.current);
    Object.values(v).forEach((value) => value.stopAnimation());
  };

  const timing = (value, toValue, duration, easing = Easing.linear) => Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

  const finish = (text, id) => {
    if (run.current !== id) return;
    setPhase(text === LIFTED ? 'done' : 'print');
    settledRef.current?.();
    setNote(text);
    AccessibilityInfo.announceForAccessibility(text);
    Animated.sequence([timing(v.note, 1, cfg.note.fade), Animated.delay(cfg.note.hold), timing(v.note, 0, cfg.note.fade)]).start(({ finished }) => {
      if (finished && run.current === id) setNote(null);
    });
  };

  // A new photo (or none): start again.
  useEffect(() => {
    run.current += 1;
    const id = run.current;
    stopAll();
    Object.values(v).forEach((value) => value.setValue(0));
    v.shown.setValue(1);
    setNote(null);
    if (!photo) {
      setPhase('ghost');
      return undefined;
    }
    setPhase('shot');
    if (reduceMotion) {
      v.photo.setValue(1);
      setPhase('wait');
      return undefined;
    }
    timing(v.photo, 1, T.shot, ease).start(({ finished }) => {
      if (finished && run.current === id) setPhase('wait');
    });
    return undefined;
    // Only a different photo restarts it.
  }, [photo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The shot is in: wait for the lift, then play the rest.
  useEffect(() => {
    if (phase !== 'wait') return undefined;
    const id = run.current;
    if (lift === undefined) {
      if (reduceMotion) return undefined;
      v.line.setValue(1);
      breath.current = Animated.loop(Animated.sequence([timing(v.line, T.breatheMin, T.breathe), timing(v.line, 1, T.breathe)]));
      breath.current.start();
      return () => {
        breath.current?.stop();
        breath.current = null;
      };
    }
    const lifted = Boolean(lift?.uri);
    if (reduceMotion || !lifted) {
      // The crossfade: Reduce Motion's, and a failed lift's (the motion stops after step 1).
      v.line.setValue(0);
      v.settle.setValue(1);
      setPhase('pull');
      Animated.parallel([timing(v.shown, 0, T.crossfade), timing(v.result, 1, T.crossfade)]).start(({ finished }) => {
        if (!finished) return;
        if (lifted) haptic();
        finish(lifted ? LIFTED : NOT_LIFTED, id);
      });
      return undefined;
    }
    setPhase('pull');
    v.line.setValue(1);
    v.result.setValue(1);
    Animated.sequence([
      timing(v.wipe, 1, T.pull),
      timing(v.line, 0, 0),
      timing(v.halo, 1, T.haloIn),
      timing(v.halo, 0, T.haloOut),
      timing(v.settle, 1, T.settle, ease),
    ]).start(({ finished }) => {
      if (finished) finish(LIFTED, id);
    });
    // The halo's haptic, at 900 (the pull's end). Cleared by a new photo (stopAll), not by the phase moving on.
    buzz.current = setTimeout(() => run.current === id && haptic(), T.pull);
    return undefined;
  }, [phase, lift]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // The cutout: its place on the page, and where it sat in the shot (cover-cropped to 3 : 4).
  const cut = lift?.uri && lift.aspect ? place(lift.aspect, lift.edges ?? {}) : null;
  let from = cut;
  if (cut && lift.box && photo?.width && photo?.height) {
    const s = Math.max(shot.w / photo.width, shot.h / photo.height);
    const x0 = shot.x + (shot.w - photo.width * s) / 2;
    const y0 = shot.y + (shot.h - photo.height * s) / 2;
    from = { x: x0 + lift.box.x * photo.width * s, y: y0 + lift.box.y * photo.height * s, w: lift.box.width * photo.width * s, h: lift.box.height * photo.height * s };
  }
  const back = (a, b) => v.settle.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  const cutTransform = cut
    ? [{ translateX: back(from.x - cut.x, 0) }, { translateY: back(from.y - cut.y, 0) }, { scaleX: back(from.w / cut.w, 1) }, { scaleY: back(from.h / cut.h, 1) }]
    : [];

  const showShot = photo && (phase === 'shot' || phase === 'wait' || phase === 'pull');
  const photoScale = v.photo.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 1 : cfg.photo.scaleFrom, 1] });
  const wipeY = v.wipe.interpolate({ inputRange: [0, 1], outputRange: [0, shot.h] });
  const unwipeY = v.wipe.interpolate({ inputRange: [0, 1], outputRange: [0, -shot.h] });
  const lineW = shot.w + 2 * cfg.line.overhang;

  return (
    <View style={{ width, height }}>
      <View style={[styles.reach, { top: -page.pull.dots }]}>
        <DotGround />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.clip]}>
        {phase === 'ghost' || !photo ? (
          <View style={[styles.ghost, { left: f.x, top: f.top, width: f.w, height: f.h }]}>
            <Glyph name="photo" token={icon.ghost} color={color.text.placeholder} />
            <View style={styles.ghostButton}>
              <Button variant="secondary" size="compact" raised label="Take a photo" onPress={onTake} disabled={busy} />
            </View>
            <View style={styles.ghostLink}>
              <Button variant="text" small label="Choose from Photos" onPress={onChoose} disabled={busy} />
            </View>
          </View>
        ) : null}
        {phase === 'ghost' || !photo ? (
          // Turn 38 (38a): what the photo is for, at the moment of choosing; it goes with the footprint.
          <View pointerEvents="none" style={[styles.hint, { top: f.top + f.h + cfg.ghost.hintGap }]}>
            <Text variant="bodySm" color="secondary">
              Reads the label, so you can tap instead of type.
            </Text>
          </View>
        ) : null}

        {photo && cut ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: cut.x, top: cut.y, width: cut.w, height: cut.h, opacity: v.result, transformOrigin: [0, 0, 0], transform: cutTransform }}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.halo, { opacity: v.halo }]}>
              <Image source={{ uri: lift.uri }} style={styles.fill} accessible={false} />
            </Animated.View>
            <Image source={{ uri: lift.uri }} style={styles.fill} accessible={false} />
          </Animated.View>
        ) : null}
        {photo && lift && !lift.uri ? (
          // The print (state b), as the bag page draws it.
          <Animated.View pointerEvents="none" style={[styles.print, { left: f.x, top: f.top, width: f.w, height: f.h, padding: page.mat, opacity: v.result }]}>
            <Image source={{ uri: photo.uri }} style={styles.fill} resizeMode="cover" accessible={false} />
          </Animated.View>
        ) : null}

        {showShot ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: shot.x, top: shot.y, width: shot.w, height: shot.h, opacity: Animated.multiply(v.photo, v.shown), transform: [{ scale: photoScale }] }}>
            {/* The pull: the frame moves down by the wipe and the photo back up, so only what's under the line stays. */}
            <Animated.View style={[styles.clip, { width: shot.w, height: shot.h, transform: [{ translateY: wipeY }] }]}>
              <Animated.View style={{ width: shot.w, height: shot.h, transform: [{ translateY: unwipeY }] }}>
                <Image source={{ uri: photo.uri }} style={styles.fill} resizeMode="cover" accessible={false} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        ) : null}
        {showShot && !reduceMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.line, { left: shot.x - cfg.line.overhang, top: shot.y - cfg.line.edge, width: lineW, opacity: v.line, transform: [{ translateY: wipeY }] }]}
          />
        ) : null}

        {note ? (
          <Animated.View pointerEvents="none" style={[styles.note, { bottom: cfg.note.bottom, opacity: v.note }]}>
            <Text variant="labelEyebrow" color="secondary">
              {note}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/** The system's Reduce Motion, read once and followed. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setReduce(on), () => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

const styles = StyleSheet.create({
  reach: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  clip: {
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  ghost: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cfg.ghost.gap,
    paddingHorizontal: cfg.ghost.padX,
    borderWidth: dashed.addTile.width,
    borderStyle: dashed.addTile.style,
    borderColor: dashed.addTile.color,
    backgroundColor: cfg.ghost.fill,
  },
  ghostButton: {
    alignSelf: 'stretch',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ghostLink: {
    marginTop: cfg.ghost.linkGap - cfg.ghost.gap,
  },
  // The halo: the cutout's own alpha casts it (no background, so iOS shadows the image's shape).
  halo: {
    shadowColor: cfg.halo.color,
    shadowOpacity: 1,
    shadowRadius: cfg.halo.radius,
    shadowOffset: { width: 0, height: 0 },
  },
  print: {
    position: 'absolute',
    backgroundColor: color.surface.raised,
  },
  line: {
    position: 'absolute',
    height: cfg.line.edge + cfg.line.height,
    borderTopWidth: cfg.line.edge,
    borderTopColor: cfg.line.edgeColor,
    backgroundColor: cfg.line.color,
  },
  note: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
