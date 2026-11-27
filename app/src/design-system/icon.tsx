import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArticleIcon } from 'phosphor-react-native/src/icons/Article';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChartBarIcon } from 'phosphor-react-native/src/icons/ChartBar';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { FireIcon } from 'phosphor-react-native/src/icons/Fire';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { KeyIcon } from 'phosphor-react-native/src/icons/Key';
import { ListChecksIcon } from 'phosphor-react-native/src/icons/ListChecks';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TimerIcon } from 'phosphor-react-native/src/icons/Timer';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { ArrowClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowClockwise';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ChecksIcon } from 'phosphor-react-native/src/icons/Checks';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { FloppyDiskIcon } from 'phosphor-react-native/src/icons/FloppyDisk';
import { FunnelIcon } from 'phosphor-react-native/src/icons/Funnel';
import { GlobeIcon } from 'phosphor-react-native/src/icons/Globe';
import { HourglassIcon } from 'phosphor-react-native/src/icons/Hourglass';
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LinkBreakIcon } from 'phosphor-react-native/src/icons/LinkBreak';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { UploadSimpleIcon } from 'phosphor-react-native/src/icons/UploadSimple';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { ArchiveIcon } from 'phosphor-react-native/src/icons/Archive';
import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { View, type ColorValue } from 'react-native';

import { Colors } from './tokens';

// Imports individuais evitam incluir o catálogo inteiro no pacote do aplicativo.
const icons = {
  'arrow-right': ArrowRightIcon, article: ArticleIcon, bell: BellIcon,
  calendar: CalendarBlankIcon, 'caret-left': CaretLeftIcon, 'caret-right': CaretRightIcon,
  chat: ChatCircleIcon, 'chart-bar': ChartBarIcon, check: CheckIcon, flame: FireIcon, gear: GearSixIcon,
  house: HouseIcon, key: KeyIcon, 'list-checks': ListChecksIcon, search: MagnifyingGlassIcon,
  pencil: PencilSimpleIcon, timer: TimerIcon, user: UserIcon, 'user-plus': UserPlusIcon, users: UsersIcon,
  'arrow-clockwise': ArrowClockwiseIcon,
  'arrow-counter-clockwise': ArrowCounterClockwiseIcon,
  camera: CameraIcon,
  'check-circle': CheckCircleIcon,
  checks: ChecksIcon,
  clock: ClockIcon,
  copy: CopyIcon,
  'floppy-disk': FloppyDiskIcon,
  funnel: FunnelIcon,
  globe: GlobeIcon,
  hourglass: HourglassIcon,
  image: ImageIcon,
  info: InfoIcon,
  'link-break': LinkBreakIcon,
  lock: LockIcon,
  'map-pin': MapPinIcon,
  phone: PhoneIcon,
  plus: PlusIcon,
  'shield-check': ShieldCheckIcon,
  'sign-out': SignOutIcon,
  trash: TrashIcon,
  'upload-simple': UploadSimpleIcon,
  x: XIcon,
  archive: ArchiveIcon,
  'calendar-plus': CalendarPlusIcon,
} as const;

export type IconName = keyof typeof icons;

export type IconProps = {
  name: IconName;
  color?: ColorValue;
  size?: number;
};

// Sempre decorativo: quem diz o que o ícone faz é o rótulo do botão ou o texto ao lado.
export function Icon({ name, color = Colors.text, size = 24 }: IconProps) {
  const Drawing = icons[name];
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, pointerEvents: 'none' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Drawing color={typeof color === 'string' ? color : Colors.text} size={size} weight="regular" />
    </View>
  );
}
