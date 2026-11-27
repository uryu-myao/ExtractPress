/**
 * MoreCoffee design tokens — React Native.
 *
 * Reverse-extracted from 30 shipped screens (see design-system.md).
 * Source of truth: process/evidence.md · Date: 2026-09-20
 *
 * Conventions:
 *  - Every px value is a plain `number` (RN takes unitless numbers).
 *  - lineHeight is absolute px, already converted from the authored multiplier.
 *  - letterSpacing is absolute px, already converted from the authored em value.
 *  - Values marked UNDECLARED had no line-height in the source; nothing is invented.
 *    Omit the property and let the platform default apply.
 *  - No CSS variables, no Tailwind config, no em, no unitless line heights.
 */

export const color = {
  text: {
    primary: '#273D22',
    secondary: '#5C5049',
    muted: '#6B5D55',
    /**
     * An empty field's invitation (placeholder, "Add a bag", an add slot's
     * label) — one colour for all of them (decided 2026-10-12, settles D-38:
     * text.secondary read like an entered value on device). The tab bar's
     * inactive grey: 3.08:1 on raised, the 3:1 floor; 8o drew #A39389.
     */
    placeholder: '#9B8F87',
    accent: '#9E5202',
    accentStrong: '#8A4602',
    success: '#4A6640',
    /**
     * A command that deletes something saved, or throws away input lost by
     * leaving (Design Round 24, 26a / 26b): its label only, never a fill,
     * frame or shadow (§1 Tap affordance). 5.82:1 on ground, 6.59:1 on
     * raised, 4.74:1 on state.pressed.surface. Used for nothing else; apart
     * from axis.bitterness by form (words, never a bar or key) and hue (ΔE00 9.2).
     */
    destructive: '#B4153F',
    onInverse: '#F4EDEA',
  },
  surface: {
    ground: '#F4EDEA',
    raised: '#FFFCFA',
    sunken: '#EFE4DC',
    inverse: '#273D22',
    muted: '#E4D6CC',
    mutedStrong: '#D9C7BB',
  },
  border: {
    strong: '#273D22',
    muted: '#C8BCB4',
    soft: '#D8C9BF',
    subtle: '#E4D6CC',
    medium: '#B3A69E',
    accent: '#8A4602',
    /**
     * Alias of border.muted (Design Round 22, 24b): the 2px frame of a box
     * that holds things or leads elsewhere — cards, form sections, list
     * blocks, a sheet's top edge — and chrome edges (the bottom bar's and a
     * foot panel's top rule). A control's frame stays border.strong. Its own
     * name because border.muted also means "unselected" and "disabled".
     */
    container: '#C8BCB4',
  },
  badge: {
    bg: {
      neutral: '#EDE4DF',
      accent: '#F1E3D6',
      success: '#E2EADC',
      info: '#E6EFF5',
      raised: '#FFFCFA',
      selected: '#273D22',
    },
    fg: {
      neutral: '#5C5049',
      accent: '#8A4602',
      success: '#2F4A28',
      info: '#0A5E92',
      selected: '#F4EDEA',
    },
  },
  icon: {
    default: '#273D22',
    muted: '#6B5D55',
    accent: '#9E5202',
    onAction: '#FFFFFF',
    rating: '#C9821A',
    /** A delete row's bin (Design Round 24): alias of text.destructive. */
    destructive: '#B4153F',
  },
  action: {
    bg: '#067BC2',
    fg: '#FFFFFF',
  },
  /** Text cursor. The only focus expression in the product. */
  caret: '#067BC2',
  /** Square bullet on a section heading. */
  marker: {
    required: '#9E5202',
    optional: '#C8BCB4',
  },
  /**
   * THE DIVIDER (Uryu, 2026-11-15): every line that divides — list rows'
   * hairlines, the form fields' underlines, Profile's stat rules, the dashed
   * card split (dashed.dividerSoft), 8g's rules — is divider.hairline at
   * shape.borderWidth.divider (1). Two tiers lighter than the frames'
   * border.container (#C8BCB4 → #D8C9BF → #E4D6CC) and thinner (1, against 2), so a
   * divider never reads as a frame. hairlineStrong is not for dividers.
   * divider.hairline is an alias of border.subtle.
   */
  divider: {
    hairline: '#E4D6CC',
    hairlineStrong: '#D8C9BF',
  },
  /** Modal sheet scrim. The page behind it also drops to opacity 0.45. */
  scrim: 'rgba(39, 61, 34, 0.42)',
  /**
   * The taste axes' identity colours (Design Round 21, 23a; Turn 30, 31a).
   * One per axis in the registry (src/constants/tasteAxes.js), keyed by its
   * colorToken, and used for those axes only (AxisReadout's fill, the change
   * tags' key), never as text, never for anything else. They say which axis
   * and nothing more: not good or bad, not entered or computed (the marker
   * says that), not in force. Outside §1's three roles, like icon.rating.
   * Contrast on track / card / ground: 3.08–5.21 / 4.28–7.24 / 3.78–6.40.
   * A new axis is one registry entry plus one colour here, picked into the
   * set's ΔE00 band (31a: 20.1–57.7); check:dna fails if the two disagree.
   */
  axis: {
    acidity: '#7C7D0F',
    /**
     * Ember (2026-11-13, Turn 30, 31a): was axis.roast, same hex. Ember was
     * picked as heat rather than bean, and char is what bitterness tastes of.
     * BITTERNESS IS A NEW DIMENSION THAT MERELY INHERITS THE HUE — it is not
     * roast renamed. Bitterness comes from over-extraction as much as from
     * roast level, which is why the two had to separate; roast level is now
     * a fact of the bag (bags.roast_level) with no axis and no colour.
     */
    bitterness: '#9D3D36',
    body: '#614A87',
    sweetness: '#AE5A84',
    /** Tide (2026-11-13, Turn 30, 31a): OKLCH L 0.46 · C 0.08 · h 187; 4.82:1 on the track. */
    aftertaste: '#03665F',
  },
} as const;

/** Mechanism-bound state colors (class A: promoted regardless of frequency). */
export const state = {
  error: {
    border: '#9E5202',
    surface: '#EFD9C2',
    text: '#8A4602',
    shadow: { offsetX: 4, offsetY: 4, blur: 0, color: '#9E5202' },
    dashedBorder: { width: 1.5, style: 'dashed', color: '#9E5202' },
  },
  /** Archived bag thumbnails. RN has no style filter — see OQ-5. */
  archived: { filter: 'saturate(0.7)' },
  /**
   * Pressed (Hard Rule, design-system.md §1) depends on whether the element has
   * a surface. With one (a fill, frame or box), the fill steps one tier darker:
   * surface / action below. Without one (a bare glyph), it scales: scale below,
   * over motion.press. Never opacity in either case — it would wash out
   * HardShadow and the borders on the warm ground.
   */
  pressed: {
    /** raised / ground / transparent-over-raised fills. Alias of surface.muted. */
    surface: color.surface.muted,
    /**
     * A frameless whole row (list rows, "Manage my beans", My beans' card
     * info) — 2026-10-18, on device: surface.muted's beige read loud on a
     * row. The ink at 6%, laid over whatever is under it: #E8E2DE on ground,
     * #F2F0ED on raised — the smallest step that still shows, low in chroma,
     * from the app's own ink, and the ground's grain shows through. The row's
     * fill also bleeds past its content to its container's edges (the screen,
     * or the card's frame). Framed controls keep `surface`: their frame
     * carries the shape.
     */
    row: 'rgba(39, 61, 34, 0.06)',
    /**
     * action.bg fill. Same value as the former color.text.link (removed
     * 2026-10-20), kept as its own role.
     */
    action: '#05639C',
    /**
     * Surface-less elements (bare glyphs, e.g. the bottom-bar tab icons). 0.88
     * because ~0.95 is not perceptible on a 20–24px glyph. Visual only: the
     * touch area does not scale.
     */
    scale: 0.88,
  },
} as const;

/**
 * The page texture (GrainTexture). texture.grain, paper grain (handoff-ground
 * v1, 2026-11-17, Turn 34 / 35b): a transparent PNG tile,
 * assets/textures/grain.png / @2x / @3x, rgb(89, 64, 46) at alpha 0–9% (mean
 * about 4.5%), softly blurred, seamless, tiled at 160 × 160 pt over
 * surface.ground (unchanged). The paper colour stays a token; the grain is
 * the PNG, not an SVG feTurbulence (react-native-svg has none).
 * Retired: texture.dot (2026-11-17; the 7 × 7 tile, 1px #E4D6CC dot) and
 * texture.rule (2026-10-11, with the old display axis).
 */
export const texture = {
  grain: {
    tile: 160,
  },
  /**
   * The dot grid under a section of bags (Design Round 31 v2, 37e; 35d's
   * grid): #DCCEC5 (35d's warm-200, edge-faint) dots 2 pt across, every 22
   * both ways from an 11, 11 origin, so a column lands on every gutter line,
   * on flat paper. Home's shelf, the Beans grid, the bag page's visual;
   * never inside a tile, never a page ground (the page keeps the grain).
   */
  dots: {
    color: '#DCCEC5',
    pitch: 22,
    origin: 11,
    radius: 1,
  },
} as const;

/**
 * 15 composite text styles. Do not patch a single property —
 * that is the signal to define a new style.
 */
export const textStyle = {
  displayLg:     { fontFamily: 'Instrument Serif', fontSize: 40, fontWeight: '400', lineHeight: 41 },
  displaySm:     { fontFamily: 'Instrument Serif', fontSize: 30, fontWeight: '400', lineHeight: 31 },
  /** 3d's "Finished bags" entry (2026-10-14, from the mock). */
  displayXs:     { fontFamily: 'Instrument Serif', fontSize: 24, fontWeight: '400', lineHeight: 24 },
  numeralHero:   { fontFamily: 'Instrument Serif', fontSize: 96, fontWeight: '400', lineHeight: 79 },
  /** Home's cups total in its panel (Design Round 22 §5, 2026-11-07): 64 at the hero's 0.82. */
  numeralLg:     { fontFamily: 'Instrument Serif', fontSize: 64, fontWeight: '400', lineHeight: 52 },
  numeralInline: { fontFamily: 'Instrument Serif', fontSize: 22, fontWeight: '400', lineHeight: 22 },
  /**
   * My words (5b's input, 2c's display). Upright since 2026-10-12: the app
   * uses no italics (Uryu, on device). Promoted from exceptions.md E-3
   * (2026-10-06).
   */
  note:          { fontFamily: 'Instrument Serif', fontSize: 20, fontWeight: '400', lineHeight: 28 },

  /**
   * 2a's row, line 3 when it holds My words (handoff-records §3, 34g option
   * A): Instrument Serif 15 / 17, text.secondary, upright, one line. 2026-11-16.
   */
  noteRow:       { fontFamily: 'Instrument Serif', fontSize: 15, fontWeight: '400', lineHeight: 17 },
  /**
   * 2a's day gutter (handoff-records §2): the day of the month over its
   * weekday, Instrument Serif 26 / 24, ink. 2026-11-16.
   */
  dayNumeral:    { fontFamily: 'Instrument Serif', fontSize: 26, fontWeight: '400', lineHeight: 24 },

  /** lineHeight UNDECLARED in source */
  title:         { fontFamily: 'Archivo', fontSize: 16, fontWeight: '700' },
  /** Add a bag's Roaster value (Design Turn 37, 38a: 16 / 600 ink; the placeholder takes the same face, a TextInput has one) */
  fieldValue:    { fontFamily: 'Archivo', fontSize: 16, fontWeight: '600' },
  /** lineHeight UNDECLARED in source */
  label:         { fontFamily: 'Archivo', fontSize: 15, fontWeight: '700' },
  body:          { fontFamily: 'Archivo', fontSize: 14, fontWeight: '500', lineHeight: 21 },
  /** 13b's notice: "‹cup title›" (noticeName) "deleted." (notice), one line. 2026-10-13. */
  noticeName:    { fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  notice:        { fontFamily: 'Archivo', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  bodySm:        { fontFamily: 'Archivo', fontSize: 12, fontWeight: '500', lineHeight: 18 },
  /** bodySm with tabular numerals: 8l's result heading, whose count changes as you type (Design Round 10, 19). */
  bodySmTabular: { fontFamily: 'Archivo', fontSize: 12, fontWeight: '500', lineHeight: 18, fontVariant: ['tabular-nums'] },
  meta:          { fontFamily: 'Archivo', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  /** A count read against others in a column: 8g's My numbers, "14 notes" (Design Round 17, 21a; 14 / 600, tabular). */
  countTabular:  { fontFamily: 'Archivo', fontSize: 14, fontWeight: '600', lineHeight: 21, fontVariant: ['tabular-nums'] },
  /** lineHeight UNDECLARED · 0.08em x 12 */
  labelCaps:     { fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', letterSpacing: 0.96, textTransform: 'uppercase' },
  /** A pushed page's title in caps beside Back: 8f, 8g (21a, 21d) and Licences. 13 / 700 · 0.12em x 13. 2026-11-10. */
  titleCaps:     { fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', letterSpacing: 1.56, textTransform: 'uppercase' },
  /**
   * A taste axis's name in its title column (31b, 31d: "5b's axisLabel"),
   * and 8f's step word beside the bar. 10 / 700 caps · 0.06em x 10. Ink for
   * the name, text.secondary for the step word. lineHeight 17: meta's, the
   * readout row's height. 2026-11-14.
   */
  axisLabel:     { fontFamily: 'Archivo', fontSize: 10, fontWeight: '700', lineHeight: 17, letterSpacing: 0.6, textTransform: 'uppercase' },
  /**
   * "Not noted yet" over an empty readout track (31b): 11 / 500 on a raised
   * patch, in text.placeholder. 3.08:1, under the text floor ON PURPOSE: it
   * marks an absence, not information. Do not "fix" the contrast. 2026-11-14.
   */
  axisEmpty:     { fontFamily: 'Archivo', fontSize: 11, fontWeight: '500', lineHeight: 17 },
  /**
   * A detail row's label (31g / 32a "About the coffee": Origin, Region,
   * Process; 29b draws 19a's date rows in this family): 14 / 600,
   * text.secondary. The value beside it is `label` (15 / 700, ink). 2026-11-14.
   */
  detailLabel:   { fontFamily: 'Archivo', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  /** A detail row with nothing recorded: "Add", 15 / 500 in text.muted (31g). 2026-11-14. */
  detailEmpty:   { fontFamily: 'Archivo', fontSize: 15, fontWeight: '500' },
  /**
   * Buy me a coffee's one line (28e / 28g): "Extract Press has no ads and no
   * account. …", then the thank-you in its place. 15 / 600 on 22 (the mock's
   * 1.5), ink, centred. 2026-11-20.
   */
  lead:          { fontFamily: 'Archivo', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  /** A tip's price in its tag (28e / 28g): Instrument Serif 20 on 20 (the mock's line-height 1). StoreKit's string. 2026-11-20. */
  priceTag:      { fontFamily: 'Instrument Serif', fontSize: 20, fontWeight: '400', lineHeight: 20 },
  /**
   * A sheet's explaining line (32e "No country called …", 32f "Not here?" and
   * "Regions are listed by origin …"): 13 / 500, text.secondary. 2026-11-14.
   */
  sheetNote:     { fontFamily: 'Archivo', fontSize: 13, fontWeight: '500', lineHeight: 19 },
  /**
   * A text action in a sheet, sentence case (32e / 32f: Clear, "Use “…” as
   * written", Choose origin first): 13 / 600, ink, underlined by TextLink
   * (§1: a text-only action is underlined). lineHeight UNDECLARED. 2026-11-14.
   */
  textLink:      { fontFamily: 'Archivo', fontSize: 13, fontWeight: '600' },
  /**
   * A country's flag emoji in the Origin sheet's rows (2026-11-15): 20 on a
   * 24 line. Archivo has no emoji; the system's emoji font draws it.
   */
  flag:          { fontFamily: 'Archivo', fontSize: 20, fontWeight: '500', lineHeight: 24 },
  /** 5b's reading column (30b / 30c): the value entered, "3.5". 15 / 700, tabular so 3.5 and 4 line up. 2026-11-14. */
  axisReading:   { fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', lineHeight: 15, fontVariant: ['tabular-nums'] },
  /** 5b's reading column when the axis is not assessed: "Not noted", 11 / 600 in text.muted (30a). lineHeight UNDECLARED. 2026-11-14. */
  axisUnset:     { fontFamily: 'Archivo', fontSize: 11, fontWeight: '600' },
  /**
   * 2a's row, line 2 (handoff-records §0): how and from where, 13 / 500,
   * text.secondary. sheetNote's values, its own name for the row. 2026-11-16.
   * Letter spacing 0.04em x 13 (Uryu, 2026-11-17, on device: "Pour-over
   * dripper" read cramped).
   */
  rowSource:     { fontFamily: 'Archivo', fontSize: 13, fontWeight: '500', lineHeight: 19, letterSpacing: 0.52 },
  /**
   * 2a's row, under the rating: the time ("08:10", grouped by Month) or the
   * date ("Nov 16"): 11 / 600, text.muted, tabular so the column holds still.
   * Letter spacing 0.04em x 11 (Uryu, 2026-11-17, on device, with rowSource).
   * lineHeight UNDECLARED. 2026-11-16.
   */
  rowWhen:       { fontFamily: 'Archivo', fontSize: 11, fontWeight: '600', letterSpacing: 0.44, fontVariant: ['tabular-nums'] },
  /** lineHeight UNDECLARED · 0.12em x 10 (was 0.16em; tightened on Uryu's ask, 2026-11-09) */
  labelEyebrow:  { fontFamily: 'Archivo', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  /** lineHeight UNDECLARED · 9 / 700 caps, .14em: the Optional tag (Design Turn 37, 38a; Badge placement 'tag') */
  tagCaps:       { fontFamily: 'Archivo', fontSize: 9, fontWeight: '700', letterSpacing: 1.26, textTransform: 'uppercase' },
  /** A bag tile's caption (Design Round 31, 37a): the name, the status under it ("Day 7 · drink now"), and the roaster over a letter block. */
  tileName:      { fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  tileMeta:      { fontFamily: 'Archivo', fontSize: 12, fontWeight: '500', lineHeight: 16 },
  tileStatus:    { fontFamily: 'Archivo', fontSize: 10, fontWeight: '700', lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' },
  tileEyebrow:   { fontFamily: 'Archivo', fontSize: 9, fontWeight: '700', lineHeight: 11, letterSpacing: 1.26, textTransform: 'uppercase' },
  /** The bag camera's title over the feed (Design Round 31 v2, 37j): serif 26, white. */
  cameraTitle:   { fontFamily: 'Instrument Serif', fontSize: 26, fontWeight: '400', lineHeight: 28 },
  /**
   * The Save bar's button (32a, 2026-11-14): 14 / 700 caps .06em, between
   * labelCaps (12) and buttonCaps (16). lineHeight UNDECLARED.
   */
  buttonCapsBar: { fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', letterSpacing: 0.84, textTransform: 'uppercase' },
  /** The Save bar's count, "1 change" (32a): 13 / 600, tabular so the bar holds still as it counts. 2026-11-14. */
  saveCount:     { fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', lineHeight: 18, fontVariant: ['tabular-nums'] },
  /** lineHeight UNDECLARED · 0.06em x 16 */
  buttonCaps:    { fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', letterSpacing: 0.96, textTransform: 'uppercase' },
  /**
   * Shares family/size/weight with labelEyebrow but is a separate style:
   * content is already a single capital letter (no textTransform) and the
   * letter spacing is 8x smaller to keep one glyph optically centred.
   * lineHeight UNDECLARED · 0.02em x 10
   */
  weekday:       { fontFamily: 'Archivo', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  /**
   * The bottom bar's tab names under the glyphs (2026-10-18, ours). 10: the
   * smallest size on the scale, as iOS's own tab labels. Sentence case, a
   * weight under labelEyebrow's so the four names stay quiet beside the
   * glyphs. lineHeight 12 is set so the block's height is fixed.
   */
  tabLabel:      { fontFamily: 'Archivo', fontSize: 10, fontWeight: '600', lineHeight: 12, letterSpacing: 0.2 },
  /**
   * The only "this word is tappable" expression. Pair with color.text.primary
   * (ink; Design 2026-10-20 — blue means "in force", not "pressable").
   * textDecorationColor is a separate RN prop — verify it inherits the text color.
   * lineHeight UNDECLARED · 0.08em x 11
   */
  inlineAction:  { fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', letterSpacing: 0.88, textTransform: 'uppercase', textDecorationLine: 'underline' },
  /** beanFreshness's "Day 7 · drink now" (3d / 4b). Same metrics as inlineAction, no underline: a status, not an action. */
  meterLabel:    { fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', letterSpacing: 0.88, textTransform: 'uppercase' },
  /** inlineAction that can't be pressed now: no underline (3f's Reopen at 5 / 5, Design Round 6). Pair with text.muted. */
  inlineActionOff: { fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', letterSpacing: 0.88, textTransform: 'uppercase' },
} as const;

/**
 * Primitive spacing scale — 9 steps. Implementation vocabulary only;
 * designers pick from `spacing` below.
 * NOT a 4pt grid: 14 is a deliberate exception (exact midpoint of 12 and 16,
 * so its nearest step is not uniquely determined). Do not normalise. Do not add steps.
 */
export const space = {
  2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 14: 14, 16: 16, 20: 20, 28: 28,
} as const;

/** Semantic spacing. Two axes, because padding is authored as `v h`. */
export const spacing = {
  inset: {
    container: { v: space[14], h: space[16] },
    control:   { v: space[14], h: space[16] },
    /**
     * Use for: chip rows that must hold one line (Design Round 15, F3).
     * Everything else keeps inset.control at 44 (5a's maker chips, 8l's
     * scopes). Pair with gap.controlCompact.
     * Added 2026-10-26 (Uryu) for 2a's category chips (gone with Design
     * Round 15; search's Kind and flavour chips use it now) and 2b's Group by,
     * which took two lines on narrow phones. 32 tall; a hit-slop
     * of control.v − controlCompact.v above and below keeps the 44 target
     * (size.tapTarget). h 6 was too tight on device.
     */
    controlCompact: { v: space[8], h: space[8] },
    /**
     * A row in an app list (Design Round 9, 2026-10-18): lists have no item
     * dividers, so the padding alone sets the rhythm (the list's gap is 0).
     * Round 9 draws 12 (was 16) and 11 (was 14 / 13 / 12); 11 is off the
     * scale and folds to 12, so every list row is 12. h: rows in a framed
     * list (the pickers); a row on the screen gutter takes v only.
     */
    listRow:   { v: space[12], h: space[16] },
  },
  badge: {
    /** chips that sit inside a list row */
    inline:     { v: space[4], h: space[8] },
    /** chips that sit alone on a surface */
    standalone: { v: space[8], h: space[12] },
    /** the Optional tag beside a label (Design Turn 37, 38a: 3 / 6) */
    tag:        { v: 3, h: space[6] },
  },
  gap: {
    /** within one meaning unit (label + value, heading + caption) */
    tight:   space[4],
    /** between items */
    row:     space[8],
    /**
     * between sections, between cards, and inside an enclosed surface —
     * including the taste axis readout rows (31b, 12 apart), which always
     * sit inside a framed card (2026-11-14: no third name for 12).
     */
    section: space[12],
    /** taste-axis groups only — an internal rhythm of the axis component */
    axis:    space[20],
    /**
     * Use for: between the chips of a row that must hold one line, with
     * inset.controlCompact (Design Round 15, F3). Uryu, 2026-10-26:
     * tight (4) read cramped; row (8) would push 2b's Group by off one line
     * at 402pt.
     */
    controlCompact: space[6],
  },
  /**
   * margin.container has NO default: 66 uses across 13 values, mode = 20%.
   * Pick a primitive explicitly at the point of use. See OQ-9.
   */
} as const;

/** Screen chrome — roughly one use per screen. Not part of the component scale. */
export const layout = {
  gutter: 22,
  screen: { top: 60, bottom: 34 },
  section: { gap: 56 },
  empty: { block: 100 },
} as const;

/** Optical compensations, kept verbatim. Never snap these to the scale. */
export const opticalMargin = {
  nudge: -2,
  handle: -6,
} as const;

/** Fixed element dimensions. NEVER subject to the spacing scale. */
export const size = {
  /** minimum hit area — 26 screens / 79 uses */
  tapTarget: 44,
  /** row (44): a button inside a row or card, e.g. 3d's Finish bag strip (2026-10-10). */
  button: { primary: 56, row: 44, compact: 40, small: 36 },
  control: { row: 52 },
  field: { height: 46 },
  /**
   * An underlined form field's line box (BagForm's Field / DayField; Uryu,
   * 2026-11-15: the underline closer to the text): the text centred in 36
   * sits about 8 over the line (was 46, about 13). Framed fields keep
   * field.height.
   */
  underlineField: { height: 36 },
  /**
   * list: the list row (2a). summary: the one-cup summary row (5b).
   * compact: Home's shelf rows (Round 14, 17a / 17b; settles D-51 for Home).
   * photoField: a form's photo slot, 3c's (and 3e / 3g's) 76 square, 2026-11-01.
   */
  thumbnail: { list: 66, summary: 40, compact: 44, photoField: 76 },
  /**
   * A choice sheet's row (32e / 32f), at least this tall: a name alone sits
   * centred in it; with a meta line it grows. Padding is spacing.inset.listRow
   * (32e draws 10, off the scale; every list row is 12).
   */
  choiceRow: 48,
  /** A row of the Bag photo sheet (Design Round 31 v2, 37m), at least this tall. */
  sheetRow: 56,
  /**
   * The flag's slot at the front of an Origin sheet row: kept on every row,
   * empty for a written origin with no code, so names never shift.
   */
  flagSlot: 24,
  /**
   * Home's shelf rows, the status column on the right (Round 14, 17a / 17b):
   * the mini freshness bar's width, and the column's least width. The column
   * hugs its text past this (2026-10-27): "Last · 6 days ago" and "Last · Apr
   * 12, 2025" measure 90 and 101 in bodySm, so a fixed 84 would not hold them.
   */
  statusColumn: 84,
  /**
   * Home's top block (Design Round 21, 23b): the stat column (This month,
   * Bags, Cafés) beside the hero numeral. Fixed until the total reaches four
   * digits, then it hugs its content (build questions, 5). Not the shelf's
   * statusColumn above.
   */
  statColumn: 150,
  avatar: 88,
  /**
   * tabBar.height: the bar's row above the home-indicator inset. 56 since
   * 2026-10-18, to carry the tab names under the glyphs: the 40 slot box with
   * 8 above and below (glyph 20 + gap.tight + tabLabel 12 = 36, centred in
   * it). Was 48 (2026-10-12; 60 before, too much room under bare icons).
   */
  tabBar: { height: 56 },
  badge: { numeral: 22 },
  checkbox: 24,
  /**
   * The toggle switch (8g 8i 8j 8m; 3e is drift D-20), 2026-10-10. knob = h −
   * 2·border(2) − 2·inset. The taste axis handle is derived from this geometry.
   */
  switch: { w: 52, h: 30, knob: 22, inset: 2 },
  weekday: { column: 68 },
  /**
   * Taste axis input (Turn 29, 30d; was 260 × 34 with a 26 handle, 2026-10-08):
   * a 28-tall track that FILLS the row between the title and reading
   * columns (166 at 402), and a SQUARE 20 handle, the Switch knob's geometry
   * (border 2 + inset 2 on each side, so handle = rail − 8). Nine stops on
   * the 1–5 scale in halves: (166 − 2·2 − 2·2 − 20) / 8 = 17.25pt apart at
   * 402, 13.9 at 375. dot: the marks at the whole numbers. clear: 30b's ✕,
   * a 24 square (its touch area is 44: size.tapTarget). key: the change
   * tags' colour key only (31e); h is meter.track.
   */
  axis: { rail: 28, inset: 2, handle: { w: 20, h: 20 }, dot: 6, clear: 24, key: { w: 12, h: 4 } },
  meter: { track: 4 },
  marker: { line: { w: 2, h: 14 } },
  /**
   * The column grid every taste axis row shares, input (5b, 30c / 30d) and
   * readout (31b / 31d): the axis name in a fixed title column on the left
   * (88, set by ja's アフターテイスト at 85; a longer title wraps, the column
   * never widens), the track filling the rest, and a right column: 5b's
   * reading (the number and ✕, or "Not noted") or 8f's step word. Fixed, so
   * every track starts and ends on the same x in every state and language.
   */
  axisColumn: { title: 88, reading: 56, step: 56 },
  dot: { bullet: 6 },
  sheet: {
    handle: { w: 56, h: 5 },
    /** 15b's info sheet: at most this share of the window's height; its body scrolls (Design Round 8). */
    info: { maxHeight: 0.78 },
  },
  /** 13b's one-line notice above the bottom bar (2026-10-13). */
  notice: { minHeight: 48 },
} as const;

/**
 * Icons are stroke-based and take currentColor.
 * Stroke width is inversely correlated with size — always use the pair.
 */
export const icon = {
  xs: { size: 14, strokeWidth: 3.4 },
  sm: { size: 16, strokeWidth: 2.6 },
  /** default */
  md: { size: 18, strokeWidth: 2.2 },
  lg: { size: 22, strokeWidth: 1.8 },
  /** The bag photo's glyphs (Design Round 31 v2, 37m): the bag page's photo button and the Bag photo sheet's rows, 20 at 2.2. */
  action: { size: 20, strokeWidth: 2.2 },
  /** Add a bag's empty footprint (Design Turn 37, 38a): the camera over Take a photo, 22 at 2.2. */
  ghost: { size: 22, strokeWidth: 2.2 },
  /** decorative large glyph — stroke widens back */
  xl: { size: 38, strokeWidth: 2.0 },
  /** 5b's ✕ on a 24 square (30b): 12 at 3, so the cross holds its weight that small */
  clear: { size: 12, strokeWidth: 3 },
  /** the ⓘ inside a status stamp (15a, Design Round 8): 14 at 2.4, lighter than xs */
  stamp: { size: 14, strokeWidth: 2.4 },
  /** 2a's mode glyph filling a 48 thumb with no photo (handoff-records §3): 22 at 2 */
  mode: { size: 22, strokeWidth: 2 },
  /**
   * 2a's small marks (handoff-records §3): My words' pen, and the mode glyph
   * in a photo thumb's 20 corner mark. 12 at 2.4.
   */
  mark: { size: 12, strokeWidth: 2.4 },
  /** Buy me a coffee's picture (28e): the mug at 48, 1.6, in a 96 tile. */
  hero: { size: 48, strokeWidth: 1.6 },
  /** fill icons are a separate system: no stroke, fixed color, rating stars only */
  fill: {
    sm: { size: 14, color: color.icon.rating },
    /** 2c's rating line (its mock draws 20; added 2026-10-13) */
    md: { size: 20, color: color.icon.rating },
    xl: { size: 38, color: color.icon.rating },
  },
} as const;

/**
 * Hard shadows: blur 0, isotropic offset, single ink. Offset scales with the element.
 * RN cannot reproduce blur-0 shadows with standard props (Android elevation has no
 * zero-blur form). Layer an absolutely-positioned View, or draw with react-native-svg.
 * See OQ-6.
 */
export const shadow = {
  /** inline controls, 40-48px tall */
  control:  { offsetX: 3, offsetY: 3, blur: 0, color: color.text.primary },
  /** width-flexible or floating elements */
  floating: { offsetX: 4, offsetY: 4, blur: 0, color: color.text.primary },
  /** full-width primary buttons (h56, w100%) */
  primary:  { offsetX: 5, offsetY: 5, blur: 0, color: color.text.primary },
} as const;

/** Shape rules are absolute. */
export const shape = {
  /** 0 occurrences of border-radius across all 30 screens. */
  radius: 0,
  borderWidth: {
    /** the outline of a box */
    box: 2,
    /**
     * every line that divides (color.divider.hairline): 1 (Uryu,
     * 2026-11-15: 1.5 read too close to the frames' 2; was 1.5, shared
     * with the weak frames)
     */
    divider: 1,
    /** a weak frame, all round (chips, the delete row, a swatch): 1.5 */
    weak: 1.5,
  },
} as const;

/**
 * dashed has two uses, and only two (decided 2026-10-18, Uryu;
 * design-system.md §8). It never says "you can press this": a pressable add
 * entry is a button (AddButton, the lists' add rows, 5b's Search opener).
 *   a frame: an empty or not-started state
 *     emptyFrame     an empty list's frame (2a), not pressable
 *     sealed         a bag not opened yet (3d)
 *     requiredSlot   a required field not filled yet (the Required bar)
 *   a line: two parts of one block
 *     dividerSoft    splits one card into two parts that belong together
 *                    (never between blocks or list items)
 * Removed 2026-10-18: addSlot (the pressable add slot), and addSlotInert's
 * "add that can't be pressed now" (now a disabled button).
 */
export const dashed = {
  /**
   * an empty state's frame, not a thing to press (2a's empty list frame; not
   * built). Was addSlotInert, which also covered a blocked add button.
   */
  emptyFrame:    { width: 2, style: 'dashed', color: color.border.muted },
  /**
   * 2a's empty archive (34b): the ghost row and its thumb, an example of a
   * row not started yet; not pressable (handoff-records §4).
   */
  ghost:         { width: 1.5, style: 'dashed', color: color.border.muted },
  /** the line that splits one card or block into two parts that belong together */
  dividerSoft:   { width: 1, style: 'dashed', color: color.divider.hairline },
  /**
   * a bag card whose bag is not opened yet (3d, 2026-10-17): the card's own
   * 2px ink frame, dashed — not started.
   */
  sealed:        { width: 2, style: 'dashed', color: color.border.strong },
  /**
   * Home's empty beans shelf (Design Round 31 v2, 37l): the Add a bag tile,
   * a bag tile's size on the dots, dashed: not started (§8). Pressable.
   */
  addTile:       { width: 1.5, style: 'dashed', color: color.text.muted },
  /**
   * a required field not filled yet, in Log a cup's Required bar (Design
   * Round 9, 2026-10-18): 1.5 dashed, no fill. The "not entered" use (as the
   * old track), not an add entry: the slot is not pressable. Colour:
   * text.muted (Design's copy check, 2026-10-18), the slot's label colour;
   * the bar's frame keeps border.muted.
   */
  requiredSlot:  { width: 1.5, style: 'dashed', color: color.text.muted },
} as const;

/**
 * Two motions, one easing. CSS transitions do not exist in RN — reproduce with
 * Easing.bezier(...controlPoints). See OQ-7.
 *   expand  height expand / collapse, crossfades between states (the source's
 *           one motion, 5a)
 *   press   press feedback only (state.pressed.scale in and out). 340ms reads
 *           as lag under a finger. Same easing as expand.
 * Do not use press for expansion or expand for press feedback.
 */
export const motion = {
  expand: { duration: 340, controlPoints: [0.22, 0.61, 0.36, 1] as const },
  press: { duration: 100, controlPoints: [0.22, 0.61, 0.36, 1] as const },
  /** 13b's notice: how long it stays between fading in and out (2026-10-13). */
  notice: { hold: 2000 },
} as const;

/**
 * Tilted sticker badge. Format as `${rotation.sticker}deg` at use. Not on the
 * Taste DNA stamp since Design Round 8 (2026-10-17): a button doesn't tilt.
 */
export const rotation = {
  sticker: -3,
} as const;

/**
 * Taste axis parts (design-system.md §9 Taste axis slider). Defined apart so
 * component.axis.state can pair them; read them through the state map, not
 * one by one.
 */
const axisRail = {
  /**
   * The slider's one track, in every state (2026-10-08): a 2px frame on the
   * card colour, with a dot at each stop. The track states nothing; the handle
   * does. Colours read off Uryu's screenshot, matched to the nearest tokens:
   *   frame  #5C5049 — color.text.secondary (ΔE 0.8; no border token is that dark
   *          short of ink)
   *   dots   #E4D6CC — border.subtle, the value of the reference lines they
   *          replace; visibility on the card 1.33:1 against the screenshot's 1.40
   * Superseded: the 1.5 border.muted frame on ground with 3 reference lines.
   */
  track: { width: shape.borderWidth.box, style: 'solid', color: color.text.secondary, background: color.surface.raised, dot: color.border.subtle },
} as const;

const axisNeedle = {
  /**
   * Not assessed (30a / 30d): the same square in grey, waiting at 1. Its
   * position is a PLACEHOLDER, NOT A VALUE: never save it. Grey on purpose,
   * not "disabled": it is pressable (a tap confirms 1, a drag sets). An
   * axis not assessed has no value and no cup_axes row.
   */
  empty: { ...size.axis.handle, background: color.border.subtle, borderColor: color.border.muted, borderWidth: shape.borderWidth.box, grip: color.icon.onAction },
  /** The user's own value: accent fill, 2px ink, white grip. */
  entered: { ...size.axis.handle, background: color.icon.accent, borderColor: color.border.strong, borderWidth: shape.borderWidth.box, grip: color.icon.onAction },
  // lit (#C9821A while dragging) was removed 2026-10-08; see design-system.md §9.
} as const;

/**
 * The short vertical grip at the handle's centre: the handle's stroke wide,
 * 6 tall on the 20 handle (30d; was 8 on the 26). White in both states, so
 * the grey and brown handles read as one handle.
 */
const axisGrip = { w: shape.borderWidth.box, h: space[6] } as const;

/**
 * Log a cup's Required bar (5e, Design Round 9, 2026-10-18): one slot per
 * required field, counted live. On surface.muted (#E4D6CC; Round 9's
 * "surface.mutedStrong" was Design's slip, confirmed 2026-10-18).
 * A filled slot takes beanFreshness's "drink now" pair (the mint band, the
 * green ink), status colours rather than the active ink, so the bar never
 * reads as pressable. An empty slot is dashed.requiredSlot.
 */
const requiredBar = {
  background: color.surface.muted,
  border: { width: shape.borderWidth.weak, color: color.border.muted },
  slot: {
    height: 24,
    filled: { background: '#CFDCC8', ink: color.text.success },
    empty: { border: dashed.requiredSlot, ink: color.text.muted },
  },
} as const;

/** Component anatomies whose parts are mechanism-bound. */
export const component = {
  /**
   * Welcome's plate (Design Round 30, 36a): 9b's printed extraction rings,
   * smaller, on a brown plate at the gutter. 196 tall, a 2px ink frame, no
   * shadow (shadows are for things you press). One static image; until
   * Uryu's artwork arrives a provisional drawing stands in (WelcomePlate).
   * `rings` and `offset` are the provisional drawing's two inks: the ground
   * colour and the ink, printed a few points out of register.
   */
  welcomePlate: {
    height: 196,
    fill: color.text.accent,
    frame: { width: shape.borderWidth.box, color: color.border.strong },
    rings: color.surface.ground,
    offset: color.border.strong,
  },
  /**
   * Days since a bag was ROASTED (decided 2026-10-14, data/freshness.ts):
   * track + peak band + elapsed fill + today marker, 4px tall, with a clock
   * glyph before it and "Day 7 · drink now" after it. Single-directional, has
   * a notion of completion. todayMarker is intentionally one step darker than
   * the fill it stands on. label: the "Day N · state" text.
   * Design Round 7 (14a, 2026-10-14): the peak band is the bag's window and
   * stays mint in every state (OQ-3 settled: pastPeak's beige band was
   * drift). Green means only "drink now"; resting and past peak share the
   * neutral pair with a text.secondary label, told apart by where the marker
   * sits (before or after the band) and by the label.
   */
  beanFreshness: {
    track: color.surface.muted,
    drinkNow: { peakBand: '#CFDCC8', elapsed: '#7E9675', todayMarker: '#4A6640', label: '#4A6640' },
    pastPeak: { peakBand: '#CFDCC8', elapsed: '#C2B4AB', todayMarker: '#8C7E76', label: color.text.secondary },
    resting: { peakBand: '#CFDCC8', elapsed: '#C2B4AB', todayMarker: '#8C7E76', label: color.text.secondary },
    /** 3d's unopened bag (2026-10-17): a sealed-bag glyph and a line, no track. */
    sealed: { glyph: '#8C7E76', label: color.text.muted },
    height: size.meter.track,
    marker: { w: shape.borderWidth.box, h: size.marker.line.h },
  },
  /**
   * Taste axis slider (5b, the input): one solid rail and a square handle.
   * state: ONE axis state decides rail and handle together, so a wrong pairing
   * cannot be built. The rail is the same in every state; the handle carries
   * it: empty (muted) or entered (accent).
   *
   * A computed value is never drawn with the slider: that is AxisReadout
   * (2026-10-11; the old dashed display axis is removed). Taste DNA is
   * arithmetic on your own records, so what you put in must never look like
   * what came out of it.
   */
  axis: {
    state: {
      empty:   { rail: axisRail.track, needle: axisNeedle.empty },
      entered: { rail: axisRail.track, needle: axisNeedle.entered },
    },
    rail: { height: size.axis.rail, inset: size.axis.inset, dot: size.axis.dot },
    grip: axisGrip,
  },

  /**
   * Bottom bar (design-system.md §9; Design Round 23, 2026-11-08): the tab
   * body's slots and the +'s glyph. The pieces' height is size.tabBar.height.
   * Removed 2026-11-08: addSlot (68 × 40), addLift and add, the ink + among
   * the tabs (handoff-round23 §0); the blue +'s plus takes icon tokens.
   * The two raw icon colours were missed by the original extraction (lowercase
   * hex in the source) and added 2026-10-04: 6 and 5 screens, see changelog.
   */
  tabBar: {
    slot: { w: 60, h: 40 },
    /**
     * The body hugs its three slots (Uryu, 2026-11-17, on device: the full
     * width left too much room between the glyphs): space.12 inside the
     * frame at each end and between the slots (side by side at 8 read
     * cramped, same day); the body and the + centred as a pair, space.16
     * apart.
     */
    bodyInset: space[12],
    slotGap: space[12],
    pieceGap: space[16],
    /**
     * The glyph and name sit space.4 lower than centred in the body (Uryu,
     * 2026-11-17, on device: centred, they read high; the names have no
     * descenders and the hard shadow weights the bottom). Applied as top
     * padding in the slot, so the block moves down by half of it.
     */
    slotDrop: space[4],
    /**
     * The glyphs' box (2026-10-18): the glyphs are 19–20 tall, so each sits
     * centred in 20 and the names under them share one baseline.
     */
    glyph: 20,
    icon: {
      active: color.action.bg,
      inactive: '#9B8F87',
    },
  },
  requiredBar,
  /**
   * A bag as a tile (Design Round 31 v2, 37a–37c, 37i): no frame, the bag
   * alone on the section's dots, a caption under it. Placement is a rule,
   * not fixed numbers (components/BagTile.js):
   *   footprint  the largest 5 : 7 box inside maxW × maxH of the tile,
   *              its foot `lift` of the tile's height above the tile's foot
   *              (the baseline); its top is the top line every bag starts at
   *   snapWidth  the widest a cutout snapped to an edge may be
   *   mat        the print's white mat (state b), a share of its width
   *   letter     the no-photo block (state c): the letter's size as a share
   *              of the block's width, Latin and CJK, its line height as a
   *              share of its size, and its insets (37a: 7 / 8 at 104 wide)
   *   fade       not here: the cut's fade is made with the cutout
   *              (data/photos.ts CUTOUT)
   *   home       Home's row: tiles, their gap, the section's padding
   *              above (under the tabs' divider) and below
   *   caption    space over the caption, between its lines, over the status
   */
  bagTile: {
    footprint: { aspect: 5 / 7, maxW: 0.72, maxH: 0.76, lift: 0.08 },
    snapWidth: 0.86,
    mat: 0.035,
    letter: { latin: 1.08, cjk: 0.8, lineHeight: 0.78, insetX: 0.067, insetY: 0.077, eyebrowInset: 9, eyebrowOpacity: 0.72 },
    home: { w: 144, h: 192, gap: space[12], top: space[16], bottom: space[28] },
    /**
     * The caption, fixed at 66 whatever it holds (37c): space[8] above, the
     * name (18), nameGap, the roaster (16), statusGap, the status (14), each
     * one line, each keeping its height when empty, so every tile in a row
     * is as tall and the grid's buttons line up `action` under it.
     */
    caption: { top: space[8], nameGap: space[4], statusGap: space[6], action: 10 },
    /** The Beans grid (37c): two columns, `gap` apart, rows `rowGap` apart, 3 : 4 tiles; the section's padding above. */
    grid: { gap: space[16], rowGap: space[20], top: space[20] },
    /** Home's empty shelf (37l): the words beside the Add a bag tile, their width and drop. */
    empty: { gap: space[16], textWidth: 190, textTop: space[28], textGap: space[6], markGap: space[8] },
  },
  /**
   * A piece of gear as a tile (Design Round 31 addendum, 2026-11-24: 37b,
   * 37n, 37o, 37p). The bag tile's box, footprint, mat and caption; gear is
   * never lifted, so a photo is always the print, and no photo is the ink
   * block with the maker as its eyebrow and the type's icon (GearIcon):
   * `share` of the block's width (64 on the shelf, 76 in the grid), centred
   * across, its centre at `centreY` of the block's height. The icons are
   * drawn on a `master` square at `stroke`, which scales with them.
   */
  gearTile: {
    icon: { share: 0.62, centreY: 0.56, master: 64, stroke: 2.5 },
  },
  /**
   * The bag page's top (Design Round 31 v2, 37f–37h; components/BagTile.js
   * BagVisual, ScreenFrame's hero mode). The visual is visualHeight tall,
   * the dots full bleed. Its footprint is measured in the area under the
   * bar's line (the floating buttons' foot: the safe top plus a tap
   * target, 104 at 402 × 874): the tile's maxH and 5 : 7 of that area,
   * standing the tile's lift of the visual's height above its foot (152 ×
   * 213, top line 140, at 402 × 874). Only the bottom snaps: the subject
   * stays centred. The print's mat is `mat`; the letter block's eyebrow
   * sits `eyebrowInset` in.
   *   bar      no bar at rest; past the threshold (the visual's foot at
   *            the bar's line) the bar's paper, its hairline and the
   *            title fade in over `fade`. The bar runs `below` past the
   *            buttons' foot
   *   pull     pulling down grows the visual (the dots stay anchored to
   *            its foot) and scales the subject from its baseline by
   *            (area + pull) ÷ area, up to `max`; `dots` is how far the dots
   *            reach above the visual for it (a whole number of pitches, so
   *            they stay on the grid)
   *   title    the name under the visual: its space above, and to its meta
   *   bodyTop  the page's body under the name block
   */
  bagPage: {
    visualHeight: 384,
    mat: 7,
    eyebrowInset: 14,
    bar: { fade: 24, below: space[8] },
    pull: { max: 120, dots: 132 },
    title: { top: 18, gap: space[4] },
    bodyTop: space[16],
  },
  /**
   * Add a bag, the bag page before it's filled (Design Turn 37, 38a–38c;
   * components/BagLift.js). Its visual is the bag page's (bagPage); these
   * are what only Add a bag draws there.
   *   ghost   the empty footprint (152 × 213 at 402, the page's): dashed
   *           (dashed.addTile), paper at 72 %, the camera (in
   *           text.placeholder, Bean name's placeholder; Uryu, 2026-11-26),
   *           Take a photo and Choose from Photos stacked `gap` apart, the
   *           last two `linkGap` apart (Uryu, 2026-11-26: 10 was easy to
   *           mis-tap), `padX` inside; under it, `hintGap` below, the
   *           label line (Turn 38: "Reads the label, so you can tap instead
   *           of type.", bodySm, text.secondary, centred), gone with it
   *   photo   the shot as it lands: 3 : 4, its top on the floating
   *           buttons' foot (the bar's line), `height` of the area under
   *           that line (as the footprint is measured; 204 × 272 at 402),
   *           centred
   *   line    the pull's line: paper, `height` tall with an `edge` ink top,
   *           reaching `overhang` past the photo on each side
   *   halo    the paper glow round the cutout once lifted (38b's
   *           drop-shadow 0 / 3 / 6, as one iOS shadow)
   *   note    "Lifted out · …" and "Couldn't lift it out · …", both
   *           `bottom` above the visual's foot, under the bag (Uryu,
   *           2026-11-26; 38b draws the first under the bar's line);
   *           eyebrow, text.secondary; shown `hold`, faded in and out over
   *           `fade`
   *   time    38b's storyboard (ms): the shot, the pull, the halo (in, then
   *           out), the settle; `breathe` one half of the wait's pulse
   *           (opacity breatheMin ↔ 1); `crossfade` Reduce Motion's and the
   *           failed lift's; `ui` the camera button's fade in
   *   ease    38b's cubic-bezier(.2, .7, .2, 1), the shot and the settle
   */
  /**
   * Add a bag's fields under the visual (Design Turn 37, 38a, revised
   * 2026-11-26): the name's line (1.5 border.muted) `nameLine` under the
   * name; the Roaster field `roasterTop` under that line, its label row and
   * its `roasterHeight` value line `labelGap` apart. 38a draws 6 and 40;
   * closer on Uryu's ask (2026-11-26): the label read far from its value.
   */
  addBag: { nameLine: space[8], roasterTop: space[16], labelGap: space[2], roasterHeight: 34 },
  /**
   * Add a bag's label candidates (Design Turn 38, 39a–39d; components/
   * LabelBar.js): the keyboard's accessory bar, shared by Bean name and
   * Roaster. `height` tall on surface.raised with a weak border.muted line
   * on top. At the left the source mark: the bag's cutout `source.image`
   * tall in a `source.width` slot, a divider after it. Then the chips,
   * scrolling: `chip.height` tall, square, `chip.padX` inside, `chip.gap`
   * apart, `chip.inset` from the divider. Chips 1–2 lead (a 2 ink frame,
   * text style lead, up to lead.max wide); 3–6 step back (a weak
   * border.muted frame, body in text.secondary, up to quiet.max). CJK text
   * in Hiragino Sans (W6 lead, W3 the rest: 39d's font stack at 600 / 500).
   * Used (in either field): the quiet frame, text.muted, the check before
   * the text `checkGap` apart. Pressed: ink fill, paper text.
   */
  labelBar: {
    height: 52,
    source: { width: 46, image: 36 },
    chip: { height: 36, padX: space[12], gap: space[8], inset: space[12], checkGap: space[6] },
    lead: { max: 156 },
    quiet: { max: 112 },
    cjk: { lead: 'HiraginoSans-W6', quiet: 'HiraginoSans-W3' },
  },
  bagLift: {
    ghost: { fill: 'rgba(244, 237, 234, 0.72)', gap: 10, linkGap: space[20], padX: space[12], hintGap: 9 },
    photo: { height: 272 / 280, aspect: 3 / 4, scaleFrom: 0.96 },
    line: { height: 3, edge: 1, overhang: space[8], color: color.surface.raised, edgeColor: color.text.primary },
    halo: { color: color.surface.raised, radius: 4 },
    note: { bottom: space[8], hold: 2000, fade: 200 },
    time: { shot: 200, pull: 700, haloIn: 100, haloOut: 100, settle: 400, breathe: 600, breatheMin: 0.4, crossfade: 200, ui: 200 },
    ease: [0.2, 0.7, 0.2, 1] as const,
  },
  /**
   * The bag camera (Design Round 31 v2, 37j; components/BagCamera.js). Over
   * the feed: the frame (frameWidth of the screen's width, 3 : 4, centred in
   * the feed) as a thin line with four white corner marks, everything
   * outside it dimmed (#171717 at 48 %), the title and its line above it,
   * an eyebrow under it. White on the feed in three strengths. Under the
   * feed a panel (surface.raised, a 2 px ink top line): Take photo, then
   * Cancel centred under it.
   */
  bagCamera: {
    frameWidth: 288 / 402,
    dim: 'rgba(23, 23, 23, 0.48)',
    line: { width: 1, color: 'rgba(255, 255, 255, 0.55)' },
    mark: { length: 22, width: 3, overhang: 2, color: '#FFFFFF' },
    text: { title: '#FFFFFF', line: 'rgba(255, 255, 255, 0.88)', eyebrow: 'rgba(255, 255, 255, 0.8)' },
    textGap: space[6],
    textAbove: space[16],
    eyebrowBelow: space[16],
    panel: { top: space[20], gap: space[8], border: shape.borderWidth.box },
  },
  /**
   * Home's shelf: which of the two sides is open (Round 14, 17a / 17b). Two
   * square-ended bars at the left of the action row, not dots: the open side
   * longer and in ink, so width says it as well as colour. The mock moves
   * them over 0.2s; there is no 200 motion, so they take motion.expand (a
   * change between states), not press.
   */
  pageIndicator: {
    height: size.meter.track,
    gap: space[4],
    active: { w: 24, color: color.text.primary },
    inactive: { w: 10, color: color.border.muted },
  },
  /**
   * Search's field block, FilterToken (Design Round 15, 18x): a filter held
   * in the field (Kind, Rating, a bag, a piece of gear), removable only.
   * 30 tall (the mock's; no size step fits), ink fill, label.caps on inverse,
   * then the × (icon.xs), whose touch area is size.tapTarget.
   */
  filterToken: {
    height: 30,
    inset: { h: space[8] },
    gap: space[6],
    background: color.surface.inverse,
    label: color.text.onInverse,
    close: icon.xs,
  },
  /**
   * The chevron that says a whole row or block opens something
   * (design-system.md §1 Tap affordance; Design Round 11, C, 2026-10-23).
   * It is the only sign: a block's frame or fill never says "pressable".
   * One size and colour on every row and block. text.placeholder, the tab
   * bar's inactive grey, since 2026-11-22 (Uryu): in text.secondary the ›
   * stood out over the row it belongs to; it should only hint.
   */
  chevron: { icon: icon.sm, color: color.text.placeholder },
  /**
   * Buy me a coffee's tip rows (28e / 28g, Design Round 26 B6). Each row is
   * one control: ink frame, ground fill, 64 tall; a 36 glyph tile (1.5 frame
   * on raised), the name (label), the price in a tag (badge.bg.neutral,
   * priceTag). Pressed: state.pressed.surface, frame unchanged.
   * paid: the row just paid for, until the screen is left — the chosen role
   * (ink fill, raised text) with a check. Its tile frame and tag fill are the
   * mock's two greens on ink (#5C7253, #3D5236), which no token had; they
   * are used here only.
   * hero: the picture's tile, 96, the quiet frame (border.container), not
   * pressable.
   */
  tip: {
    row: { height: 64, inset: space[14], gap: space[12] },
    tile: { size: 36, border: shape.borderWidth.weak, borderColor: color.border.muted, background: color.surface.raised },
    glyph: { size: 20, strokeWidth: 2 },
    tag: { v: space[6], h: space[8], background: color.badge.bg.neutral },
    paid: {
      background: color.surface.inverse,
      ink: color.surface.raised,
      tileBorder: '#5C7253',
      tag: '#3D5236',
      check: { size: 18, strokeWidth: 2.6 },
    },
    hero: { tile: 96 },
  },
  /**
   * Records' list, redrawn (handoff-records.md v1, 2026-11-16; 34a–34g).
   * row:     thumb · space.12 · text (flex) · rating column · space.12 ·
   *          chevron, 6 above and below, at least 56 tall.
   * gutter:  the day gutter under a Month heading, written once per day.
   * frame:   the thumb's and the corner mark's frame.
   * mode:    the mode shown on the thumb, not read (the I MADE IT / BARISTA /
   *          PACKAGED badge is gone from the row): the existing badge pairs,
   *          tint behind, ink for the glyph. Packaged's ink is text.secondary
   *          (the same value as badge.fg.neutral).
   */
  archive: {
    row: { minHeight: 56, inset: space[6], gap: space[12] },
    thumb: 48,
    ratingColumn: 44,
    corner: 20,
    gutter: { width: 40, gap: space[12], top: space[8], dayGap: space[6] },
    frame: { width: shape.borderWidth.weak, color: color.border.muted },
    mode: {
      made_it: { tint: color.badge.bg.success, ink: color.badge.fg.success },
      barista: { tint: color.badge.bg.info, ink: color.badge.fg.info },
      packaged: { tint: color.badge.bg.neutral, ink: color.text.secondary },
    },
    /** My words' pen (34g, A): border.accent, space.4 before the words. */
    pen: { color: color.border.accent, gap: space[4] },
  },
} as const;

export const tokens = {
  color, state, texture, textStyle, space, spacing, layout, opticalMargin,
  size, icon, shadow, shape, dashed, motion, rotation, component,
} as const;

export default tokens;
