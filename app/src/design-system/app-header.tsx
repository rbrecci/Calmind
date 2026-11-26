import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from './avatar';
import { formatUnread } from './counts';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

const BACK: IconName = { ios: 'chevron.left', android: 'arrow_back_ios_new' };
const BELL: IconName = { ios: 'bell', android: 'notifications' };
const GEAR: IconName = { ios: 'gearshape', android: 'settings' };

export type AppHeaderProps = {
  tone: 'patient' | 'psychologist';
  title: string;
  icon?: IconName;
  // Tela empilhada: seta de voltar à esquerda. Sem ela, o canto fica com o avatar, se houver.
  onBack?: () => void;
  // Com `onPress`, o avatar vira botão (o paciente abre "Meu perfil" por ele).
  avatar?: { name: string; uri?: string | null; headers?: Record<string, string>; onPress?: () => void; accessibilityLabel?: string };
  // Sino, com contador quando há não lidas. Some nas telas de formulário.
  notifications?: { count?: number; onPress: () => void };
  // Engrenagem que leva à conta. Some nas telas de formulário.
  onSettings?: () => void;
  // Base reta, sem o arredondado: o bloco de destaque do início continua a cor logo abaixo.
  flush?: boolean;
};

// Cabeçalho das telas depois do login: barra na cor do lado, cobrindo a área da barra de
// status, com a base arredondada. O ponto mais claro fica no alto e no centro, como no
// protótipo: a base do lado nas pontas, o tom claro no meio, e a base de novo embaixo.
// Texto e ícones são Dark, que passa sobre os dois tons (5.4).
export function AppHeader({ tone, title, icon, onBack, avatar, notifications, onSettings, flush = false }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = RoleColors[tone];
  const count = notifications?.count ?? 0;
  const avatarImage = avatar ? <Avatar tone={tone} size={40} name={avatar.name} uri={avatar.uri} headers={avatar.headers}
    accessibilityLabel={avatar.onPress ? undefined : avatar.name} /> : null;
  return (
    <View style={[styles.root, flush && styles.flush, { paddingTop: insets.top + Spacing.two }]}>
      <LinearGradient
        colors={[colors.accent, colors.tint, colors.accent]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${colors.accent}00`, colors.accent]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        <View style={styles.side}>
          {onBack ? <HeaderButton icon={BACK} label="Voltar" onPress={onBack} />
            : avatar?.onPress ? <Pressable accessibilityRole="button" accessibilityLabel={avatar.accessibilityLabel ?? avatar.name}
              onPress={avatar.onPress} hitSlop={2} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              {avatarImage}
            </Pressable> : avatarImage}
        </View>
        <View style={styles.center}>
          {icon ? <Icon name={icon} /> : null}
          <Text variant="h5" numberOfLines={1} style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.side, styles.end]}>
          {notifications ? <HeaderButton icon={BELL} badge={count || undefined}
            label={count ? `Notificações, ${formatUnread(count)}` : 'Notificações'} onPress={notifications.onPress} /> : null}
          {onSettings ? <HeaderButton icon={GEAR} label="Conta" onPress={onSettings} /> : null}
        </View>
      </View>
    </View>
  );
}

function HeaderButton({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={2}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={icon} />
      {/* Branco com Dark: sobre a cor do lado, um contador na mesma cor sumiria. */}
      {badge ? <View style={styles.badge}><Text variant="small" style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    overflow: 'hidden',
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.background,
  },
  flush: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MinTouchTarget,
  },
  // Os dois cantos têm a mesma largura, para o título ficar no centro da tela e não do espaço
  // que sobra. Cabem dois botões de 44.
  side: {
    width: MinTouchTarget * 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  end: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  button: {
    width: MinTouchTarget,
    height: MinTouchTarget, // RNF-35
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MinTouchTarget / 2,
  },
  pressed: {
    backgroundColor: `${Colors.background}66`,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 20,
    height: 20,
    paddingHorizontal: Spacing.one,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  badgeText: {
    lineHeight: 18,
  },
});
