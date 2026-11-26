import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { api, ApiError, type FieldErrors, type LoginInput, type Role } from '@/api';
import { BackHeader, Button, ChoiceCard, Colors, ErrorBanner, Logo, RoleColors, Screen, Spacing, Text, TextField } from '@/design-system';
import { DEMO_ACCOUNTS, demoCredentials, demoEnv, isDemoLoginEnabled } from '@/auth/demo-accounts';
import { authErrorMessage, buildRegisterInput, isMinor, validateRegisterForm } from '@/auth/register-form';
import { useSession } from '@/session/session-context';

type Step = 'login' | 'choice' | 'register';

export default function EntryScreen() {
  const { role, signIn } = useSession();
  const [step, setStep] = useState<Step>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (role !== null) return <Redirect href={role === 'patient' ? '/home' : '/dashboard'} />;

  function goTo(next: Step, nextRole?: Role) {
    if (nextRole) setSelectedRole(nextRole);
    setMessage(null);
    setFieldErrors({});
    setStep(next);
  }

  async function submitLogin(credentials: LoginInput) {
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await signIn(credentials);
    } catch (error) {
      setMessage(authErrorMessage('login', error));
      setFieldErrors(error instanceof ApiError ? error.errors ?? {} : {});
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister() {
    setMessage(null);
    setFieldErrors({});
    const form = {
      role: selectedRole, name, email, birthDate, password, confirmPassword,
      guardianName, guardianPhone, guardianRelationship,
    };
    const errors = validateRegisterForm(form);
    if (Object.keys(errors).length > 0) {
      setMessage(authErrorMessage('register', new ApiError(422, '', errors)));
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      await api.register(buildRegisterInput(form));
      await signIn({ email, password });
    } catch (error) {
      setMessage(authErrorMessage('register', error));
      setFieldErrors(error instanceof ApiError ? error.errors ?? {} : {});
    } finally {
      setSubmitting(false);
    }
  }

  // No cadastro o botão fica no rodapé, fora da rolagem e acima do teclado.
  const footer = step === 'register'
    ? <Button label={submitting ? 'Criando conta...' : 'Criar conta'} disabled={submitting} onPress={submitRegister} />
    : undefined;

  return (
    <Screen scroll center={step === 'login'} footer={footer}>
      {step === 'login' ? (
        <>
          <View style={styles.brand}>
            <Logo animated />
            <Text variant="h1">Calmind</Text>
            <Text variant="small" color="textSecondary">Saúde Mental & Acolhimento</Text>
          </View>
          {message ? <ErrorBanner message={message} /> : null}
          <TextField label="E-mail" placeholder="seu@email.com" autoCapitalize="none" autoComplete="email"
            keyboardType="email-address" value={email} onChangeText={setEmail} error={fieldErrors.email?.[0]} />
          <TextField label="Senha" placeholder="Sua senha" autoCapitalize="none" autoComplete="current-password"
            secureTextEntry value={password} onChangeText={setPassword} error={fieldErrors.password?.[0]} />
          <Button label={submitting ? 'Entrando...' : 'Entrar'} disabled={submitting}
            onPress={() => submitLogin({ email, password })} />
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text variant="small" color="textSecondary">ou</Text>
            <View style={styles.line} />
          </View>
          <Button variant="secondary" label="Criar conta" disabled={submitting} onPress={() => goTo('choice')} />
          <Text variant="small" color="textSecondary" style={styles.center}>
            No cadastro você escolhe se é paciente ou psicólogo.
          </Text>
          {isDemoLoginEnabled(demoEnv) ? (
            <>
              <Text variant="small" color="textSecondary" style={styles.center}>Entrar como (versão de teste)</Text>
              {DEMO_ACCOUNTS.map((account) => {
                const credentials = demoCredentials(demoEnv, account.key);
                return credentials ? (
                  <Button key={account.key} variant="secondary" label={account.label} disabled={submitting}
                    onPress={() => submitLogin(credentials)} />
                ) : null;
              })}
            </>
          ) : null}
        </>
      ) : step === 'choice' ? (
        <>
          <BackHeader title="Criar conta" backLabel="Voltar para entrar" onBack={() => goTo('login')} />
          <Text variant="h5">Como você vai usar o Calmind?</Text>
          <Text variant="small" color="textSecondary">Essa escolha não muda depois: a conta fica presa ao perfil.</Text>
          <ChoiceCard tone="patient" title="Sou paciente"
            description="Quero acompanhar meu processo, escrever relatos e falar com meu psicólogo."
            onPress={() => goTo('register', 'patient')} />
          <ChoiceCard tone="psychologist" title="Sou psicólogo"
            description="Tenho registro no CRP e quero atender pacientes pela plataforma."
            onPress={() => goTo('register', 'psychologist')} />
          <Text variant="small" color="textSecondary" style={styles.center}>
            O registro no CRP passa por conferência antes de o perfil ir ao ar.
          </Text>
        </>
      ) : (
        <>
          <BackHeader title="Criar conta" backLabel="Voltar para escolher perfil" onBack={() => goTo('choice')} />
          {/* Etiqueta de lado: o tom claro do perfil escolhido, com texto Dark. */}
          <View style={[styles.roleTag, { backgroundColor: RoleColors[selectedRole].tint }]}>
            <Text variant="small">{selectedRole === 'patient' ? 'Paciente' : 'Psicólogo'}</Text>
          </View>
          {message ? <ErrorBanner message={message} /> : null}
          <TextField label="Nome completo" value={name} onChangeText={setName} autoComplete="name"
            error={fieldErrors.name?.[0]} />
          <TextField label="E-mail" placeholder="seu@email.com" value={email} onChangeText={setEmail} autoCapitalize="none"
            autoComplete="email" keyboardType="email-address" error={fieldErrors.email?.[0]} />
          {selectedRole === 'patient' ? (
            <>
              <TextField label="Data de nascimento" placeholder="DD/MM/AAAA" value={birthDate}
                onChangeText={setBirthDate} keyboardType="numbers-and-punctuation" error={fieldErrors.birth_date?.[0]} />
              {isMinor(birthDate) ? (
                <>
                  <Text variant="small" color="textSecondary">Para menores de 18 anos, informe o responsável.</Text>
                  <TextField label="Nome do responsável" value={guardianName} onChangeText={setGuardianName}
                    error={fieldErrors.guardian_name?.[0]} />
                  <TextField label="Telefone do responsável" value={guardianPhone} onChangeText={setGuardianPhone}
                    keyboardType="phone-pad" error={fieldErrors.guardian_phone?.[0]} />
                  <TextField label="Parentesco do responsável" value={guardianRelationship}
                    onChangeText={setGuardianRelationship} error={fieldErrors.guardian_relationship?.[0]} />
                </>
              ) : null}
            </>
          ) : null}
          <TextField label="Senha" secureTextEntry autoComplete="new-password" value={password}
            onChangeText={setPassword} error={fieldErrors.password?.[0]} />
          <TextField label="Confirmar senha" secureTextEntry autoComplete="new-password" value={confirmPassword}
            onChangeText={setConfirmPassword} error={fieldErrors.confirm_password?.[0]} />
          <Text variant="small" color="textSecondary">Mínimo de 8 caracteres.</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.three },
  center: { textAlign: 'center' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: Spacing.three, paddingVertical: Spacing.half, borderRadius: Spacing.three },
});
