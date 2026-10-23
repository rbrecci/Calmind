import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { api, ApiError, type FieldErrors, type Role } from '@/api';
import { Button, Colors, Radius, Screen, Spacing, Text, TextField } from '@/design-system';
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

  async function submitLogin() {
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await signIn({ email, password });
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

  return (
    <Screen scroll>
      {step === 'login' ? (
        <>
          <View style={styles.brand}>
            <Text variant="h1">Calmind</Text>
            <Text variant="small" color="textSecondary">Saúde Mental & Acolhimento</Text>
          </View>
          {message ? <Text variant="small" color="error" accessibilityRole="alert">{message}</Text> : null}
          <TextField label="E-mail" placeholder="seu@email.com" autoCapitalize="none" autoComplete="email"
            keyboardType="email-address" value={email} onChangeText={setEmail} error={fieldErrors.email?.[0]} />
          <TextField label="Senha" placeholder="Sua senha" autoCapitalize="none" autoComplete="current-password"
            secureTextEntry value={password} onChangeText={setPassword} error={fieldErrors.password?.[0]} />
          <Button label={submitting ? 'Entrando...' : 'Entrar'} disabled={submitting} onPress={submitLogin} />
          <Button label="Criar conta" disabled={submitting} onPress={() => goTo('choice')} />
          <Text variant="small" color="textSecondary" style={styles.center}>
            No cadastro você escolhe se é paciente ou psicólogo.
          </Text>
        </>
      ) : step === 'choice' ? (
        <>
          <Text variant="small" color="textSecondary">Criar conta</Text>
          <Text variant="h4">Como você vai usar o Calmind?</Text>
          <Text variant="small" color="textSecondary">Essa escolha não muda depois: a conta fica presa ao perfil.</Text>
          <View style={styles.choice}>
            <Text variant="h5">Sou paciente</Text>
            <Text variant="small" color="textSecondary">Quero acompanhar meu processo, escrever relatos e falar com meu psicólogo.</Text>
            <Button label="Continuar como paciente" onPress={() => goTo('register', 'patient')} />
          </View>
          <View style={styles.choice}>
            <Text variant="h5">Sou psicólogo</Text>
            <Text variant="small" color="textSecondary">Tenho registro no CRP e quero atender pacientes pela plataforma.</Text>
            <Button label="Continuar como psicólogo" onPress={() => goTo('register', 'psychologist')} />
          </View>
          <Text variant="small" color="textSecondary">O registro no CRP passa por conferência antes de o perfil ir ao ar.</Text>
          <Button label="Voltar para entrar" onPress={() => goTo('login')} />
        </>
      ) : (
        <>
          <Text variant="small" color="textSecondary">Criar conta</Text>
          <Text variant="h4">Cadastro</Text>
          <Text variant="small">Perfil: {selectedRole === 'patient' ? 'Paciente' : 'Psicólogo'}</Text>
          {message ? <Text variant="small" color="error" accessibilityRole="alert">{message}</Text> : null}
          <TextField label="Nome completo" value={name} onChangeText={setName} autoComplete="name"
            error={fieldErrors.name?.[0]} />
          <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none"
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
          <Button label={submitting ? 'Criando conta...' : 'Criar conta'} disabled={submitting} onPress={submitRegister} />
          <Button label="Voltar para escolher perfil" disabled={submitting} onPress={() => goTo('choice')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.four },
  center: { textAlign: 'center' },
  choice: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
});
