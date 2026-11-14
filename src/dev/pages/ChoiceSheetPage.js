import { StyleSheet, View } from 'react-native';
import { ChoiceSheetBody } from '../../components/ChoiceSheet';
import { PROCESS_OPTIONS } from '../../constants/cups';
import { ORIGINS, REGIONS, regionsOf } from '../../constants/origins';
import { color, shape, space, spacing } from '../../theme/tokens';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';

/**
 * ChoiceSheet (32e / 32f) in each configuration and state, its content drawn
 * inline on a raised panel (the sheet's own surface). Sample "From my bags".
 */
const mine = (rows) => rows.map(([name, n]) => ({ key: name, label: name, meta: `${n} ${n === 1 ? 'bag' : 'bags'}` }));
const ALL_ORIGINS = ORIGINS.map((o) => ({ key: o.name, label: o.name, aliases: o.aliases }));
const ORIGIN = {
  title: 'Origin',
  onClear: () => {},
  search: { placeholder: 'Search countries' },
  sections: [
    { label: 'From my bags', items: mine([['Ethiopia', 3], ['Kenya', 2], ['Colombia', 1]]) },
    { label: 'All origins', items: ALL_ORIGINS },
  ],
  selected: 'Ethiopia',
  free: { mode: 'noMatch', noMatch: (t) => `No country called “${t}”.` },
  onPick: () => {},
};
const ETHIOPIA = {
  title: 'Region',
  scope: 'In Ethiopia',
  onClear: () => {},
  search: { placeholder: 'Search regions in Ethiopia' },
  sections: [
    { label: 'From my bags', items: mine([['Guji', 2], ['Yirgacheffe', 1]]) },
    { label: 'Regions of Ethiopia', items: regionsOf('Ethiopia').map((r) => ({ key: r.name, label: r.name })).sort((a, b) => a.label.localeCompare(b.label)) },
  ],
  selected: 'Guji',
  free: { mode: 'always' },
  onPick: () => {},
};
const NO_ORIGIN = {
  title: 'Region',
  scope: 'No origin yet',
  onClear: () => {},
  search: { placeholder: 'Search every region' },
  note: { text: 'Regions are listed by origin. Set one first, or search every region and the origin fills itself in.', action: { label: 'Choose origin first', onPress: () => {} } },
  sections: [],
  pool: REGIONS.map((r) => ({ key: `${r.country}|${r.name}`, label: r.name, meta: r.country })),
  free: { mode: 'always' },
  onPick: () => {},
};
const PROCESS = {
  title: 'Process',
  onClear: () => {},
  sections: [{ items: PROCESS_OPTIONS.map((p) => ({ key: p.value, label: p.label })) }],
  selected: 'natural',
  onPick: () => {},
};

function Panel({ children }) {
  return <View style={styles.panel}>{children}</View>;
}

export default function ChoiceSheetPage() {
  return (
    <HarnessPage>
      <HarnessGroup title="Origin (32e)">
        <HarnessCase label="typed “Ke”: one Results list, the typed part in ink">
          <Panel>
            <ChoiceSheetBody {...ORIGIN} initialQuery="Ke" />
          </Panel>
        </HarnessCase>
        <HarnessCase label="no match: “Use … as written”">
          <Panel>
            <ChoiceSheetBody {...ORIGIN} initialQuery="Atlantis" />
          </Panel>
        </HarnessCase>
        <HarnessCase label="an alias: “ivory” finds Côte d'Ivoire">
          <Panel>
            <ChoiceSheetBody {...ORIGIN} initialQuery="ivory" />
          </Panel>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="Region (32f)">
        <HarnessCase label="scoped to Ethiopia, typed “Si”: Not here? always">
          <Panel>
            <ChoiceSheetBody {...ETHIOPIA} initialQuery="Si" />
          </Panel>
        </HarnessCase>
        <HarnessCase label="no origin, typed “Hu”: every country's regions, each named">
          <Panel>
            <ChoiceSheetBody {...NO_ORIGIN} initialQuery="Hu" />
          </Panel>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="Process: no search, one list, no free text">
        <HarnessCase label="Natural in force">
          <Panel>
            <ChoiceSheetBody {...PROCESS} />
          </Panel>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="Before typing: the two lists">
        <HarnessCase label="Region in Ethiopia">
          <Panel>
            <ChoiceSheetBody {...ETHIOPIA} />
          </Panel>
        </HarnessCase>
        <HarnessCase label="Origin (the A–Z list runs on)">
          <Panel>
            <ChoiceSheetBody {...ORIGIN} />
          </Panel>
        </HarnessCase>
      </HarnessGroup>
    </HarnessPage>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: color.surface.raised,
    borderTopWidth: shape.borderWidth.box,
    borderTopColor: color.border.container,
    paddingVertical: space[12],
    paddingHorizontal: spacing.inset.listRow.h,
    gap: space[14],
  },
});
