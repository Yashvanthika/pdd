import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckboxRow, Header, LinkButton, Message, PrimaryButton, Screen, SelectField, TextField } from './components';
import { useAuth } from './AuthContext';
import { apiFetch, apiPublicFetch } from './api';
import { API_ENDPOINTS } from './endpoints';
import { BLOOD_GROUPS, type BloodGroup } from './bloodGroups';
import { BLOOD_FACTS, getBloodFact, type BloodFactItem, type BloodFactCategory } from './bloodFacts';
import type { AppStackParamList, AuthStackParamList } from './navigation';
import { colors } from './theme';
import type { DonorProfile, DonorSearchResult } from './types';
import { getCities, getDistricts, getStates } from '../data/indiaLocations';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type RegisterProfileProps = NativeStackScreenProps<AuthStackParamList, 'RegisterProfile'>;
type ForgotPasswordProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
type SearchProps = NativeStackScreenProps<AppStackParamList, 'Search'>;
type ResultsProps = NativeStackScreenProps<AppStackParamList, 'Results'>;
type MyProfileProps = NativeStackScreenProps<AppStackParamList, 'MyProfile'>;
type EditProfileProps = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;
type ChangePasswordProps = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;
type LastDonationProps = NativeStackScreenProps<AppStackParamList, 'LastDonation'>;
type SettingsProps = NativeStackScreenProps<AppStackParamList, 'Settings'>;
type BloodFactsProps = NativeStackScreenProps<AppStackParamList, 'BloodFacts'>;
type BloodFactDetailProps = NativeStackScreenProps<AppStackParamList, 'BloodFactDetail'>;

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

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}

function PencilIcon() {
  return <Ionicons color={colors.primaryDark} name="create-outline" size={23} />;
}

function DonationIcon() {
  return (
    <View pointerEvents="none" style={styles.optionIcon}>
      <Ionicons color={colors.danger} name="water-outline" size={22} />
    </View>
  );
}

function LockIcon() {
  return (
    <View pointerEvents="none" style={styles.optionIcon}>
      <Ionicons color={colors.primaryDark} name="lock-closed-outline" size={22} />
    </View>
  );
}

function SettingsIcon() {
  return (
    <View pointerEvents="none" style={styles.optionIcon}>
      <Ionicons color={colors.primaryDark} name="settings-outline" size={22} />
    </View>
  );
}

function FactsIcon() {
  return (
    <View pointerEvents="none" style={styles.optionIcon}>
      <Ionicons color={colors.primaryDark} name="book-outline" size={22} />
    </View>
  );
}

function RowChevron() {
  return <Ionicons color={colors.muted} name="chevron-forward" size={24} />;
}

function ProfileAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <View style={compact ? styles.profileAvatarCompact : styles.profileAvatar}>
      <Ionicons color={colors.primaryDark} name="person-circle-outline" size={compact ? 31 : 72} />
    </View>
  );
}

function ProfileOption({ title, onPress, icon }: {
  title: string;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.profileOption, pressed && styles.profileOptionPressed]}
    >
      {icon}
      <Text style={styles.profileOptionText}>{title}</Text>
      <RowChevron />
    </Pressable>
  );
}

function FactCategoryRow({ category, index, onPress }: {
  category: BloodFactCategory;
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.factCategoryRow, pressed && styles.profileOptionPressed]}
    >
      <View style={styles.factCategoryNumber}>
        <Text style={styles.factCategoryNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.factCategoryText}>
        <Text style={styles.factCategoryTitle}>{category.title}</Text>
        <Text style={styles.factCategorySubtitle}>{category.subtitle}</Text>
      </View>
      <RowChevron />
    </Pressable>
  );
}

function FactContent({ item }: { item: BloodFactItem }) {
  if (item.kind === 'paragraph') {
    return <Text style={[styles.factParagraph, item.strong && styles.factParagraphStrong]}>{item.text}</Text>;
  }

  if (item.kind === 'table') {
    return (
      <View style={styles.factTable}>
        {item.rows.map(([left, right]) => (
          <View key={`${left}-${right}`} style={styles.factTableRow}>
            <Text style={styles.factTableCell}>{left}</Text>
            <Text style={styles.factTableCell}>{right}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.factBullets}>
      {item.items.map((text) => (
        <View key={text} style={styles.factBulletRow}>
          <View style={styles.factBulletDot} />
          <Text style={styles.factBulletText}>{text}</Text>
        </View>
      ))}
    </View>
  );
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
  const { signIn } = useAuth();
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

      await signIn(normalizedEmail, password);
    } catch (err: any) {
      const message = err.message || 'Unable to register donor.';
      setError(message);
      Alert.alert('Registration failed', message);
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
          <Pressable
            accessibilityLabel="Open my page"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate('MyProfile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
          >
            <ProfileAvatar compact />
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

export function MyProfileScreen({ navigation }: MyProfileProps) {
  const { profile, signOut } = useAuth();
  async function logout() {
    await signOut();
  }

  const profileDetails = profile ? [
    { label: 'Mobile Number', value: displayValue(profile.phone) },
    { label: 'Blood Group', value: displayValue(profile.bloodGroup) },
    { label: 'Year of Birth', value: displayValue(profile.yearOfBirth) },
    { label: 'Country', value: displayValue(profile.country) },
    { label: 'State', value: displayValue(profile.state) },
    { label: 'District', value: displayValue(profile.district) },
    { label: 'City', value: displayValue(profile.city) },
    { label: 'Available in Emergency', value: yesNo(profile.availableInEmergency) },
    { label: 'Contact Details Visible', value: yesNo(profile.displayConsent) },
  ] : [];

  return (
    <Screen>
      <Header title="My Profile" back={() => navigation.goBack()} />
      {profile ? (
        <View style={styles.profilePanel}>
          <View style={styles.profileHeader}>
            <ProfileAvatar />
            <View style={styles.profileIdentity}>
              <Text numberOfLines={2} style={styles.profileName}>{profile.fullName}</Text>
              <Text numberOfLines={1} style={styles.profileEmail}>{profile.email}</Text>
            </View>
            <Pressable
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate('EditProfile')}
              style={({ pressed }) => [styles.editProfileButton, pressed && styles.profileOptionPressed]}
            >
              <PencilIcon />
            </Pressable>
          </View>
          <View style={styles.profileDetails}>
            {profileDetails.map((item) => (
              <View key={item.label} style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>{item.label}</Text>
                <Text style={styles.profileDetailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Message text="Profile details are not available right now." tone="error" />
      )}
      <View style={styles.profileOptions}>
        <ProfileOption title="Blood Donation Facts" icon={<FactsIcon />} onPress={() => navigation.navigate('BloodFacts')} />
        <ProfileOption title="Last Donation Details" icon={<DonationIcon />} onPress={() => navigation.navigate('LastDonation')} />
        <ProfileOption title="Change Password" icon={<LockIcon />} onPress={() => navigation.navigate('ChangePassword')} />
        <ProfileOption title="Settings" icon={<SettingsIcon />} onPress={() => navigation.navigate('Settings')} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={logout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

export function BloodFactsScreen({ navigation }: BloodFactsProps) {
  return (
    <Screen>
      <Header title="Blood Donation Facts" back={() => navigation.goBack()} />
      <View style={styles.factCategoryList}>
        {BLOOD_FACTS.map((category, index) => (
          <FactCategoryRow
            key={category.id}
            category={category}
            index={index}
            onPress={() => navigation.navigate('BloodFactDetail', { factId: category.id })}
          />
        ))}
      </View>
    </Screen>
  );
}

export function BloodFactDetailScreen({ navigation, route }: BloodFactDetailProps) {
  const fact = getBloodFact(route.params.factId);

  if (!fact) {
    return (
      <Screen>
        <Header title="Blood Donation Facts" back={() => navigation.goBack()} />
        <Message text="This facts category could not be found." tone="error" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Blood Donation Facts" subtitle={fact.title} back={() => navigation.goBack()} />
      <View style={styles.factDetailCard}>
        <Text style={styles.factDetailTitle}>{fact.sectionTitle}</Text>
        {fact.items.map((item, index) => (
          <FactContent key={`${fact.id}-${index}`} item={item} />
        ))}
      </View>
      <Message text="Eligibility and deferral rules can vary by blood bank. Follow the screening decision of a qualified medical professional." />
    </Screen>
  );
}

export function SettingsScreen({ navigation }: SettingsProps) {
  const { deleteProfile } = useAuth();

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

  return (
    <Screen>
      <Header title="Settings" back={() => navigation.goBack()} />
      <View style={styles.settingsPanel}>
        <Text style={styles.settingsTitle}>Account</Text>
        <PrimaryButton title="Delete Profile" tone="danger" onPress={confirmDelete} />
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
  factBulletDot: {
    backgroundColor: colors.text,
    borderRadius: 4,
    height: 7,
    marginTop: 9,
    width: 7,
  },
  factBulletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  factBulletText: {
    color: '#333333',
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  factBullets: {
    marginTop: 4,
  },
  factCategoryList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  factCategoryNumber: {
    alignItems: 'center',
    backgroundColor: '#e0f7fc',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  factCategoryNumberText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  factCategoryRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: '#eceff3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  factCategorySubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  factCategoryText: {
    flex: 1,
    minWidth: 0,
  },
  factCategoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  factDetailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  factDetailTitle: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 14,
  },
  factParagraph: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
  },
  factParagraphStrong: {
    color: colors.text,
    fontWeight: '900',
  },
  factTable: {
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  factTableCell: {
    color: '#333333',
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  factTableRow: {
    borderBottomColor: colors.danger,
    borderBottomWidth: 1,
    flexDirection: 'row',
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
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  profileButtonPressed: {
    opacity: 0.5,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: '#e0f7fc',
    borderColor: '#a5e5f2',
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  profileAvatarCompact: {
    alignItems: 'center',
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  profileDetailLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  profileDetailRow: {
    borderTopColor: '#eceff3',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  profileDetailValue: {
    color: colors.text,
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'right',
  },
  profileDetails: {
    marginTop: 16,
  },
  profileEmail: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  profileIdentity: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  profileOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: '#eceff3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
  },
  profileOptionPressed: {
    opacity: 0.55,
  },
  profileOptionText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  profileOptions: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  profilePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  editProfileButton: {
    alignItems: 'center',
    backgroundColor: '#eef9fc',
    borderColor: '#b9e8f1',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  settingsPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  settingsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
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
