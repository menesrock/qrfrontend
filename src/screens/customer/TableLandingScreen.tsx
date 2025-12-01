import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Portal, Dialog } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UI_COLORS } from '../../config/constants';
import { customersService } from '../../services/customers.service';
import { ordersService } from '../../services/orders.service';
import { tablesService } from '../../services/tables.service';

export const TableLandingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params as { tableId?: string; tableSlug?: string }) || {};
  const [tableId, setTableId] = useState('');
  const [tableSlug, setTableSlug] = useState('');
  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  const [consentDialogVisible, setConsentDialogVisible] = useState(false);
  const isWeb = typeof window !== 'undefined';

  useEffect(() => {
    let id = '';
    let slug = '';
    
    // Priority 1: Query params (most reliable - UUID)
    if (isWeb) {
      const search = new URLSearchParams(window.location.search);
      id = search.get('tableId') || search.get('table') || '';
    }
    
    // Priority 2: Route params
    if (!id) {
      id = params.tableId || '';
    }
    if (!slug) {
      slug = params.tableSlug || '';
    }
    
    // Priority 3: URL path (table name as fallback)
    if (isWeb && typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const tableIndex = pathParts.indexOf('table');
      if (tableIndex !== -1 && pathParts[tableIndex + 1]) {
        const pathSlug = decodeURIComponent(pathParts[tableIndex + 1]);
        // Ignore 'undefined' string
        if (pathSlug && pathSlug !== 'undefined') {
          if (!slug) {
            slug = pathSlug;
          }
          // If no tableId from query, use slug as fallback
          if (!id) {
            id = pathSlug;
          }
        }
      }
    }
    
    console.log('TableLandingScreen - Extracted tableId:', id, 'tableSlug:', slug, 'from params:', params, 'from URL:', isWeb ? window.location.href : 'N/A');
    
    if (id) {
      setTableId(id);
    }
    if (slug) {
      setTableSlug(slug);
    }
  }, [params.tableId, params.tableSlug, isWeb]);

  useEffect(() => {
    if (!tableId || !isWeb) {
      return;
    }
    const savedEmail = sessionStorage.getItem(`customer_email_${tableId}`);
    if (savedEmail) {
      setEmail(savedEmail);
      // Check for active order first
      checkActiveOrderAndNavigate(savedEmail);
    }
  }, [tableId, tableSlug, navigation, isWeb]);
  
  const checkActiveOrderAndNavigate = async (emailValue: string) => {
    try {
      // Check for active order
      const orders = await ordersService.getAll({ 
        tableId,
        status: 'pending,confirmed,preparing,ready'
      });
      
      const activeOrder = orders.find(
        (o: any) => o.customerEmail === emailValue && 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );
      
      if (activeOrder) {
        // Save order ID to sessionStorage
        sessionStorage.setItem(`active_order_${tableId}_${emailValue}`, activeOrder.id);
        // Navigate directly to menu (will show order status)
        handleContinueWithEmail(emailValue, false);
      } else {
        // No active order, proceed normally
        handleContinueWithEmail(emailValue, false);
      }
    } catch (error) {
      console.error('Failed to check active order:', error);
      // On error, proceed normally
      handleContinueWithEmail(emailValue, false);
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen email adresinizi girin');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Hata', 'Lütfen geçerli bir email adresi girin');
      return;
    }

    // Show consent dialog if not already consented
    if (!emailConsent) {
      setConsentDialogVisible(true);
      return;
    }

    await handleContinueWithEmail(email.trim(), emailConsent);
  };

  const handleContinueWithEmail = async (emailValue: string, consent: boolean) => {
    try {
      // Create or update customer in backend
      await customersService.createOrUpdate({
        email: emailValue,
        emailConsent: consent,
      });

      // Use tableId if available, otherwise use a default or show error
      const finalTableId = tableId || 'unknown';
      const finalTableSlug = tableSlug || finalTableId;
      
      console.log('Continue clicked - tableId:', finalTableId, 'tableSlug:', finalTableSlug, 'email:', emailValue);
      
      // Update table status to occupied when customer logs in
      if (finalTableId && finalTableId !== 'unknown') {
        try {
          await tablesService.update(finalTableId, {
            status: 'occupied',
            occupiedSince: new Date().toISOString(),
            currentOccupants: [{
              name: emailValue.split('@')[0],
              joinedAt: new Date().toISOString(),
            }],
          });
        } catch (tableError) {
          console.error('Failed to update table status:', tableError);
          // Continue even if table update fails
        }
      }
      
      if (isWeb) {
        sessionStorage.setItem(`customer_email_${finalTableId}`, emailValue);
      }
      
      try {
        (navigation as any).navigate('CustomerMenu', { 
          tableId: finalTableId, 
          customerEmail: emailValue,
          customerName: emailValue.split('@')[0], // Use email prefix as display name
          tableSlug: finalTableSlug,
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Hata', 'Menüye yönlendirilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error: any) {
      console.error('Failed to create/update customer:', error);
      Alert.alert('Hata', error.response?.data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleConsentAccept = async () => {
    setEmailConsent(true);
    setConsentDialogVisible(false);
    await handleContinueWithEmail(email.trim(), true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>Hoş geldiniz</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {tableId ? `Masa ${tableSlug || tableId}` : 'Geçerli bir QR kod tarayın'}
            </Text>
            <TextInput
              label="Email Adresiniz"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete={Platform.OS === 'web' ? 'email' : undefined}
            />
            <View style={styles.consentContainer}>
              <Checkbox
                status={emailConsent ? 'checked' : 'unchecked'}
                onPress={() => setConsentDialogVisible(true)}
              />
              <Text 
                style={styles.consentText}
                onPress={() => setConsentDialogVisible(true)}
              >
                Mailleriniz mail marketing için tutulmaktadır
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!email.trim() || !validateEmail(email.trim())}
              style={styles.button}
            >
              Menüye Devam Et
            </Button>
            {!tableId && (
              <Text style={styles.warning}>
                Uyarı: Masa bilgisi bulunamadı. Devam ederseniz varsayılan masa kullanılacak.
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog 
          visible={consentDialogVisible} 
          onDismiss={() => setConsentDialogVisible(false)}
        >
          <Dialog.Title>Email Marketing İzni</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Mailleriniz mail marketing amaçlı saklanmaktadır. Size özel kampanyalar, 
              indirimler ve haberler gönderebiliriz. İstediğiniz zaman bu izni geri çekebilirsiniz.
            </Text>
            <Text variant="bodySmall" style={styles.dialogSubtext}>
              KVKK kapsamında verileriniz güvenle saklanmaktadır.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setConsentDialogVisible(false);
              setEmailConsent(false);
            }}>
              Reddet
            </Button>
            <Button onPress={handleConsentAccept} mode="contained">
              Kabul Et
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI_COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: UI_COLORS.surface,
    borderRadius: 16,
    paddingVertical: 8,
  },
  title: { textAlign: 'center', marginBottom: 4, color: UI_COLORS.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', marginBottom: 24, color: UI_COLORS.textSecondary },
  input: { marginBottom: 16 },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  consentText: {
    flex: 1,
    marginLeft: 8,
    color: UI_COLORS.textSecondary,
    fontSize: 14,
  },
  button: { marginTop: 8 },
  warning: {
    marginTop: 8,
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
  },
  dialogText: {
    marginBottom: 12,
    color: UI_COLORS.textPrimary,
  },
  dialogSubtext: {
    color: UI_COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
