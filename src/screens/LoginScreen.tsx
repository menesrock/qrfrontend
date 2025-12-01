import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UI_COLORS } from '../config/constants';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, loading, error, clearError } = useAuth();
  const { colors } = useTheme();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    if (error) {
      clearError();
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await signIn(email, password);
    } catch (err) {
      // Error is handled in AuthContext
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="headlineLarge" style={[styles.title, { color: colors.primary }]}>
          QR Restaurant
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Sign in to continue
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={(value) => handleInputChange(setEmail, value)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={!!errors.email}
            disabled={loading}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={(value) => handleInputChange(setPassword, value)}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            error={!!errors.password}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          {error && (
            <HelperText type="error" visible={true} style={styles.errorText}>
              {error}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            Sign In
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: UI_COLORS.surface,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: UI_COLORS.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: UI_COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
  },
});
