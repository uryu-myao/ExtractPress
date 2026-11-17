import { View } from 'react-native';
import Badge from '../../components/base/Badge';
import ArchiveRow from '../../components/base/ArchiveRow';
import ModeThumb from '../../components/base/ModeThumb';
import { archiveLines } from '../../constants/cups';
import { spacing } from '../../theme/tokens';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';
import { SAMPLE } from '../samples';

const T = new Date(2026, 10, 16, 8, 10).getTime();
const cup = (fields) => ({ id: 0, logged_at: T, rating: 4, flavours: [], note: null, photo_uri: null, ...fields });
const ARCHIVE = [
  ['I made it — method · roaster, My words', cup({ mode: 'made_it', bean_name: 'Ethiopia Guji', brew_method: 'V60', bean_roaster: 'Blue Bottle', bean_process: 'washed', note: 'Peach first,\nthen tea as it cooled.' }), '08:10'],
  ['Barista — drink, café, flavours', cup({ mode: 'barista', drink_type: 'House espresso', place_name: 'Fuglen Tomigaya', flavours: ['Cocoa', 'Walnut'], rating: 5 }), '11:42'],
  ['Barista — no drink: the café is the title (one line, centred on the thumb)', cup({ mode: 'barista', place_name: 'Fuglen Tomigaya', rating: 3 }), '15:05'],
  ['Packaged — product, shop; nothing noted (no line 3)', cup({ mode: 'packaged', product_name: 'Boss Craft Black', bought_at_name: 'Lawson', rating: 2 }), '19:30'],
  ['long lines · en', cup({ mode: 'made_it', bean_name: SAMPLE.name.en, brew_method: 'Kalita Wave 185', bean_roaster: 'Onibus Coffee', bean_process: 'anaerobic', note: SAMPLE.note.en, rating: 1 }), '23:59'],
];

export default function RecordRowPage() {
  return (
    <HarnessPage>
      <HarnessGroup title="Badge · tones (inline)">
        <HarnessCase label="success (I made it) · info (Barista) · neutral (Packaged) · accent · raised · selected">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gap.row }}>
            <Badge label="I made it" tone="success" />
            <Badge label="Barista" tone="info" />
            <Badge label="Packaged" tone="neutral" />
            <Badge label="Accent" tone="accent" />
            <Badge label="Raised" tone="raised" />
            <Badge label="Selected" tone="selected" />
          </View>
        </HarnessCase>
        <HarnessCase label="standalone placement">
          <Badge label="Early signs" tone="accent" placement="standalone" />
        </HarnessCase>
      </HarnessGroup>

      <HarnessGroup title="ArchiveRow · Records' row (handoff-records §3, 34c)">
        <HarnessCase label="thumbs: I made it · Barista · Packaged · ghost (34b)">
          <View style={{ flexDirection: 'row', gap: spacing.gap.row }}>
            <ModeThumb mode="made_it" />
            <ModeThumb mode="barista" />
            <ModeThumb mode="packaged" />
            <ModeThumb ghost />
          </View>
        </HarnessCase>
        {ARCHIVE.map(([label, cup, when]) => (
          <HarnessCase key={label} label={label}>
            <ArchiveRow cup={cup} lines={archiveLines(cup, 'month')} when={when} onPress={() => {}} />
          </HarnessCase>
        ))}
      </HarnessGroup>

    </HarnessPage>
  );
}
