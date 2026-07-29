import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 24);

  if (!scroll) {
    return (
      <View style={[styles.screen, { paddingBottom: bottomInset, paddingTop: topInset }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + spacing.screen }]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({ title, subtitle, back, action }: {
  title: string;
  subtitle?: string;
  back?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {back ? (
          <Pressable onPress={back} style={styles.iconButton}>
            <Text style={styles.iconText}>{'<'}</Text>
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        editable={editable}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, !editable && styles.disabledInput]}
        placeholderTextColor="#a3a3a3"
      />
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, tone = 'primary' }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'neutral';
}) {
  const backgroundColor = tone === 'danger' ? colors.danger : tone === 'neutral' ? '#374151' : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor },
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkButton}>
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

export function Message({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' | 'success' }) {
  const backgroundColor = tone === 'error' ? '#fef2f2' : tone === 'success' ? '#ecfdf5' : '#eff6ff';
  const color = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : '#1d4ed8';
  return (
    <View style={[styles.message, { backgroundColor }]}>
      <Text style={[styles.messageText, { color }]}>{text}</Text>
    </View>
  );
}

export function CheckboxRow({ label, value, onValueChange }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onValueChange(!value)} style={styles.checkboxRow}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxText}>{label}</Text>
    </Pressable>
  );
}

export function SwitchRow({ label, value, onValueChange }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary, false: '#cbd5e1' }} />
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onSelect,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sortedOptions = useMemo(() => options, [options]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable disabled={disabled} onPress={() => setOpen(true)} style={[styles.select, disabled && styles.disabledSelect]}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || `Select ${label}`}</Text>
        <Text style={styles.chevron}>v</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>{label}</Text>
            <FlatList
              data={sortedOptions}
              keyExtractor={(item) => item}
              style={styles.optionList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  style={styles.optionRow}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screen,
  },
  header: {
    marginBottom: 18,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconText: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  disabledInput: {
    color: colors.muted,
    opacity: 0.75,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: spacing.radius,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressedButton: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    borderRadius: spacing.radius,
    marginBottom: 14,
    padding: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  checkboxText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  switchLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  select: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  disabledSelect: {
    opacity: 0.5,
  },
  selectText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  placeholder: {
    color: '#a3a3a3',
    fontWeight: '500',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  optionSheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxHeight: '72%',
    padding: 16,
    width: '100%',
  },
  optionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  optionList: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  optionRow: {
    borderBottomColor: '#eceff3',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
  },
});
