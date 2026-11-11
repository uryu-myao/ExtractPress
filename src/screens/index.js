import HomeTabScreen from './HomeTabScreen';
import ProfileTabScreen from './ProfileTabScreen';
import RecordsScreen from './RecordsScreen';

// Tabs show a placeholder until their screen is rebuilt from the mock.
// Records (2a) is rebuilt; Home (1b) has its Taste DNA card; Profile is 6a's upper part (2026-10-21). The retired screens — HomeScreen, CoffeeListScreen, SearchScreen,
// ProfileScreen, NoticeListScreen, NoticeDetailScreen, AddCoffeeScreen — stay
// on disk, unreferenced and out of the bundle, as the record of what the old
// screens did.
//
// Each tab carries its mock's eyebrow: 1b and 6a the app's name, "Extract
// Press" (the mocks' "MoreCoffee" until the rename of 2026-11-08; it renders
// uppercase).
//
// No Try next tab (planner, 2026-11-08): its placeholder ("This screen is
// being rebuilt.") would fail App Review, and Try next becomes a card on Home
// (design/try-next-v1.md).

export const SCREEN_COMPONENTS = {
  home: HomeTabScreen,
  records: RecordsScreen,
  profile: ProfileTabScreen,
};
