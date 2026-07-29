import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckboxRow, Header, LinkButton, Message, PrimaryButton, Screen, SelectField, TextField } from './components';
import { useAuth } from './AuthContext';
import { apiFetch, apiPublicFetch } from './api';
import { API_ENDPOINTS } from './endpoints';
import { BLOOD_GROUPS, type BloodGroup } from './bloodGroups';
import type { AppStackParamList, AuthStackParamList } from './navigation';
import { colors } from './theme';
import type { DonorProfile, DonorSearchResult } from './types';
import { getCities, getDistricts, getStates } from '../data/indiaLocations';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type RegisterProfileProps = NativeStackScreenProps<AuthStackParamList, 'RegisterProfile'>;
type ForgotPasswordProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
type SearchProps = NativeStackScreenProps<AppStackParamList, 'Search'>;
type ResultsProps = NativeStackScreenProps<AppStackParamList, 'Results'>;
type MyPageProps = NativeStackScreenProps<AppStackParamList, 'MyPage'>;
type EditProfileProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;
type ChangePasswordProps = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;
type LastDonationProps = NativeStackScreenProps<AppStackParamList, 'LastDonation'>;

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return value.trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

function yearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 83 }, (_unused, index) => String(currentYear - 18 - index));
}

export function LoginScreen({ navigation }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleLogin() {
    setError('');
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(normalizedEmail, password);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="BloodLink" subtitle="Sign in to search registered blood donors." />
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
      <PrimaryButton title={submitting ? 'Signing In' : 'Sign In'} onPress={handleLogin} disabled={submitting || !canSubmit} />
      <View style={{ marginTop: 10 }}>
        <LinkButton title="Create donor account" onPress={() => navigation.navigate('RegisterProfile')} />
        <LinkButton title="Forgot password" onPress={() => navigation.navigate('ForgotPassword')} />
      </View>
    </Screen>
  );
}

export function RegisterProfileScreen({ navigation }: RegisterProfileProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [available, setAvailable] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const years = useMemo(yearOptions, []);
  const districts = state ? getDistricts(state) as string[] : [];
  const cities = state && district ? getCities(state, district) : [];
  const canRegister = Boolean(
    email.trim()
    && password
    && confirmPassword
    && phone.trim()
    && fullName.trim()
    && yearOfBirth
    && state
    && district
    && city
    && available
    && consent,
  );

  async function submit() {
    setError('');
    const normalizedEmail = normalizeEmail(email);
    const normalizedFullName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);
    const selectedYearOfBirth = Number(yearOfBirth);

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10 digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      await apiPublicFetch<{ profile: DonorProfile }>(API_ENDPOINTS.registerDonor, {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          phone: normalizedPhone,
          fullName: normalizedFullName,
          bloodGroup,
          yearOfBirth: selectedYearOfBirth,
          state,
          district,
          city,
          availableInEmergency: available,
          displayConsent: consent,
        }),
      });

      Alert.alert('Registration complete', 'Your donor account is ready. Please sign in.');
      navigation.popToTop();
    } catch (err: any) {
      setError(err.message || 'Unable to register donor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="Donor Registration" subtitle="Complete your donor information." back={() => navigation.goBack()} />
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Donor name" />
      <SelectField label="Blood Group" value={bloodGroup} options={[...BLOOD_GROUPS]} onSelect={(value) => setBloodGroup(value as BloodGroup)} />
      <SelectField label="Year of Birth" value={yearOfBirth} options={years} onSelect={setYearOfBirth} />
      <TextField label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
      <TextField label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 characters" />
      <TextField label="Retype Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Retype password" />
      <TextField label="Country" value="INDIA" onChangeText={() => undefined} editable={false} />
      <SelectField label="State" value={state} options={getStates()} onSelect={(value) => { setState(value); setDistrict(''); setCity(''); }} />
      <SelectField label="District" value={district} options={districts} onSelect={(value) => { setDistrict(value); setCity(''); }} disabled={!state} />
      <SelectField label="City" value={city} options={cities} onSelect={setCity} disabled={!district} />
      <CheckboxRow label="Available in case of emergency" value={available} onValueChange={setAvailable} />
      <CheckboxRow label="I authorize BloodLink to display my donor details so nearby registered users can contact me." value={consent} onValueChange={setConsent} />
      <PrimaryButton
        title={submitting ? 'Registering' : 'Register'}
        onPress={submit}
        disabled={submitting || !canRegister}
      />
    </Screen>
  );
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReset() {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('A secure password reset link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Unable to send reset link.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="Reset Password" subtitle="Enter your registered email address." back={() => navigation.goBack()} />
      {message ? <Message text={message} tone="success" /> : null}
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="Registered email ID" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
      <PrimaryButton title={submitting ? 'Sending Link' : 'Submit'} onPress={handleReset} disabled={submitting || !email} />
    </Screen>
  );
}

export function SearchScreen({ navigation }: SearchProps) {
  const { profile } = useAuth();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.bloodGroup || 'A+');
  const [state, setState] = useState(profile?.state || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [city, setCity] = useState(profile?.city || '');

  const districts = state ? getDistricts(state) as string[] : [];
  const cities = state && district ? getCities(state, district) : [];

  function search() {
    navigation.navigate('Results', { bloodGroup, state, district, city });
  }

  return (
    <Screen>
      <Header
        title="Search Donors"
        subtitle="Find available donors by blood group and location."
        action={(
          <Pressable style={styles.profileButton} onPress={() => navigation.navigate('MyPage')}>
            <Text style={styles.profileIcon}>Profile</Text>
          </Pressable>
        )}
      />
      <View style={styles.card}>
        <SelectField label="Blood Group" value={bloodGroup} options={[...BLOOD_GROUPS]} onSelect={(value) => setBloodGroup(value as BloodGroup)} />
        <SelectField label="Country" value="INDIA" options={['INDIA']} onSelect={() => undefined} />
        <SelectField label="State" value={state} options={getStates()} onSelect={(value) => { setState(value); setDistrict(''); setCity(''); }} />
        <SelectField label="District" value={district} options={districts} onSelect={(value) => { setDistrict(value); setCity(''); }} disabled={!state} />
        <SelectField label="City" value={city} options={cities} onSelect={setCity} disabled={!district} />
      </View>
      <PrimaryButton title="Search" onPress={search} disabled={!bloodGroup || !state || !district || !city} />
      <Text style={styles.helper}>Only available donors who have consented to show contact details are listed.</Text>
    </Screen>
  );
}

export function ResultsScreen({ navigation, route }: ResultsProps) {
  const [donors, setDonors] = useState<DonorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDonors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(route.params).toString();
      const data = await apiFetch<{ donors: DonorSearchResult[] }>(`${API_ENDPOINTS.donorSearch}?${query}`);
      setDonors(data.donors);
    } catch (err: any) {
      setError(err.message || 'Unable to load donors.');
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Header title="Donors List" subtitle={`${route.params.bloodGroup} in ${route.params.city}`} back={() => navigation.goBack()} />
        {error ? <Message text={error} tone="error" /> : null}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={donors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={donors.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={(
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No donors found</Text>
                <Text style={styles.emptyText}>Try a nearby city or another blood group.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.bloodGroup}</Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.phone}>{item.phone}</Text>
                  <Text style={styles.meta}>Available - {item.city}, {item.district}, {item.state}</Text>
                  {item.lastDonationDate ? <Text style={styles.meta}>Last donation: {item.lastDonationDate}</Text> : null}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

export function MyPageScreen({ navigation }: MyPageProps) {
  const { deleteProfile, signOut } = useAuth();

  function confirmDelete() {
    Alert.alert(
      'Delete Profile',
      'This permanently removes your donor profile and account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile();
          },
        },
      ],
    );
  }

  async function logout() {
    await signOut();
  }

  return (
    <Screen>
      <Header title="Blood Donor's My Page" back={() => navigation.goBack()} />
      <View style={styles.menu}>
        <PrimaryButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <PrimaryButton title="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
        <PrimaryButton title="Last Donation Details" onPress={() => navigation.navigate('LastDonation')} />
        <PrimaryButton title="Delete Profile/Unsubscribe" tone="danger" onPress={confirmDelete} />
        <PrimaryButton title="Logout" tone="neutral" onPress={logout} />
      </View>
    </Screen>
  );
}

export function EditProfileScreen({ navigation }: EditProfileProps) {
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.bloodGroup || 'A+');
  const [yearOfBirth, setYearOfBirth] = useState(profile?.yearOfBirth ? String(profile.yearOfBirth) : '');
  const [state, setState] = useState(profile?.state || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [city, setCity] = useState(profile?.city || '');
  const [available, setAvailable] = useState(Boolean(profile?.availableInEmergency));
  const [consent, setConsent] = useState(Boolean(profile?.displayConsent));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const years = useMemo(yearOptions, []);
  const districts = state ? getDistricts(state) as string[] : [];
  const cities = state && district ? getCities(state, district) : [];

  async function save() {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await apiFetch<{ profile: DonorProfile }>(API_ENDPOINTS.me, {
        method: 'PUT',
        body: JSON.stringify({
          email,
          phone,
          fullName,
          bloodGroup,
          yearOfBirth: Number(yearOfBirth),
          state,
          district,
          city,
          availableInEmergency: available,
          displayConsent: consent,
        }),
      });
      await refreshProfile();
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="Edit Profile" back={() => navigation.goBack()} />
      {message ? <Message text={message} tone="success" /> : null}
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="Full Name" value={fullName} onChangeText={setFullName} />
      <SelectField label="Blood Group" value={bloodGroup} options={[...BLOOD_GROUPS]} onSelect={(value) => setBloodGroup(value as BloodGroup)} />
      <SelectField label="Year of Birth" value={yearOfBirth} options={years} onSelect={setYearOfBirth} />
      <TextField label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextField label="Country" value="INDIA" onChangeText={() => undefined} editable={false} />
      <SelectField label="State" value={state} options={getStates()} onSelect={(value) => { setState(value); setDistrict(''); setCity(''); }} />
      <SelectField label="District" value={district} options={districts} onSelect={(value) => { setDistrict(value); setCity(''); }} disabled={!state} />
      <SelectField label="City" value={city} options={cities} onSelect={setCity} disabled={!district} />
      <CheckboxRow label="Available in case of emergency" value={available} onValueChange={setAvailable} />
      <CheckboxRow label="Allow registered users to view my contact details in donor search" value={consent} onValueChange={setConsent} />
      <PrimaryButton title={submitting ? 'Saving' : 'Save Profile'} onPress={save} disabled={submitting || !email || !phone || !fullName || !yearOfBirth || !state || !district || !city} />
    </Screen>
  );
}

export function ChangePasswordScreen({ navigation }: ChangePasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setMessage('');
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<{ ok: true }>(API_ENDPOINTS.changePassword, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setMessage('Password changed.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="Change Password" back={() => navigation.goBack()} />
      {message ? <Message text={message} tone="success" /> : null}
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="New Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextField label="Retype Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <PrimaryButton title={submitting ? 'Saving' : 'Change Password'} onPress={save} disabled={submitting || password.length < 8 || confirmPassword.length < 8} />
    </Screen>
  );
}

export function LastDonationScreen({ navigation }: LastDonationProps) {
  const { profile, refreshProfile } = useAuth();
  const [date, setDate] = useState(profile?.lastDonationDate || '');
  const [facility, setFacility] = useState(profile?.lastDonationFacility || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.lastDonationBloodGroup || profile?.bloodGroup || 'A+');
  const [units, setUnits] = useState(profile?.lastDonationUnits ? String(profile.lastDonationUnits) : '1');
  const [state, setState] = useState(profile?.lastDonationState || profile?.state || '');
  const [district, setDistrict] = useState(profile?.lastDonationDistrict || profile?.district || '');
  const [city, setCity] = useState(profile?.lastDonationCity || profile?.city || '');
  const [notes, setNotes] = useState(profile?.lastDonationNotes || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const districts = state ? getDistricts(state) as string[] : [];
  const cities = state && district ? getCities(state, district) : [];

  async function save() {
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await apiFetch<{ profile: DonorProfile }>(API_ENDPOINTS.lastDonation, {
        method: 'PUT',
        body: JSON.stringify({
          date,
          facility,
          bloodGroup,
          units: Number(units),
          state,
          district,
          city,
          notes,
        }),
      });
      await refreshProfile();
      setMessage('Last donation details saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save last donation details.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="Last Donation Details" back={() => navigation.goBack()} />
      {message ? <Message text={message} tone="success" /> : null}
      {error ? <Message text={error} tone="error" /> : null}
      <TextField label="Donation Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <TextField label="Facility / Organization" value={facility} onChangeText={setFacility} placeholder="Facility name" />
      <SelectField label="Blood Group" value={bloodGroup} options={[...BLOOD_GROUPS]} onSelect={(value) => setBloodGroup(value as BloodGroup)} />
      <TextField label="Units" value={units} onChangeText={setUnits} keyboardType="number-pad" />
      <SelectField label="State" value={state} options={getStates()} onSelect={(value) => { setState(value); setDistrict(''); setCity(''); }} />
      <SelectField label="District" value={district} options={districts} onSelect={(value) => { setDistrict(value); setCity(''); }} disabled={!state} />
      <SelectField label="City" value={city} options={cities} onSelect={setCity} disabled={!district} />
      <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <PrimaryButton title={submitting ? 'Saving' : 'Save Details'} onPress={save} disabled={submitting || !date || !facility || !state || !district || !city} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  details: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 32,
  },
  menu: {
    gap: 12,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  phone: {
    color: colors.text,
    fontSize: 18,
    marginTop: 4,
  },
  profileButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  profileIcon: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
});
