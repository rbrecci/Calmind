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
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { View, type ColorValue } from 'react-native';

import { Colors } from './tokens';

// Imports individuais evitam incluir o catálogo inteiro no pacote do aplicativo.
const icons = {
  'arrow-right': ArrowRightIcon, article: ArticleIcon, bell: BellIcon,
  calendar: CalendarBlankIcon, 'caret-left': CaretLeftIcon, 'caret-right': CaretRightIcon,
  chat: ChatCircleIcon, 'chart-bar': ChartBarIcon, check: CheckIcon, flame: FireIcon, gear: GearSixIcon,
  house: HouseIcon, key: KeyIcon, 'list-checks': ListChecksIcon, search: MagnifyingGlassIcon,
  pencil: PencilSimpleIcon, user: UserIcon, 'user-plus': UserPlusIcon, users: UsersIcon,
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
