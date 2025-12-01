import React from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { Modal, Portal, Text, Button, IconButton, Card } from 'react-native-paper';

interface ShoppingCartProps {
  visible: boolean;
  items: any[];
  onDismiss: () => void;
  onCheckout: () => void;
  onRemove: (index: number) => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  visible,
  items,
  onDismiss,
  onCheckout,
  onRemove,
}) => {
  const total = items.reduce(
    (sum: number, item: any) => sum + (item.lineTotal ?? item.price * item.quantity),
    0
  );

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss}
        dismissable={true}
        dismissableBackButton={false}
        contentContainerStyle={styles.modal}
        style={styles.modalWrapper}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Sepet
          </Text>
          <IconButton
            icon="minus"
            size={24}
            onPress={onDismiss}
            iconColor="#FFFFFF"
            style={styles.closeButton}
          />
        </View>
        
        <FlatList
          data={items}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <Card style={styles.item}>
              <Card.Content>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text variant="titleMedium" style={styles.itemName}>{item.name}</Text>
                    <Text variant="bodySmall" style={styles.quantityText}>Adet: {item.quantity}</Text>
                    {item.customizations?.map((customization: any) => (
                      <Text
                        key={`${customization.customizationId}-${index}`}
                        style={styles.customizationText}
                      >
                        {customization.name}: {customization.selectedOptions.map((o: any) => o.name).join(', ')}
                      </Text>
                    ))}
                    {item.notes && <Text variant="bodySmall" style={styles.noteText}>Not: {item.notes}</Text>}
                  </View>
                  <View style={styles.actions}>
                    <Text variant="titleMedium" style={styles.priceText}>
                      ₺{(item.lineTotal ?? item.price * item.quantity).toFixed(2)}
                    </Text>
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      onPress={() => onRemove(index)}
                      iconColor="#000000"
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Sepet boş</Text>}
        />

        <View style={styles.footer}>
          <Text variant="headlineSmall" style={styles.totalText}>Toplam: ₺{total.toFixed(2)}</Text>
          <Button 
            mode="contained" 
            onPress={onCheckout} 
            disabled={items.length === 0}
            buttonColor="#000000"
            textColor="#FFFFFF"
            style={styles.checkoutButton}
          >
            Sipariş Ver
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      pointerEvents: 'none' as any,
    }),
  },
  modal: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      position: 'relative' as any,
      pointerEvents: 'auto' as any,
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '300',
    fontFamily: Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : undefined,
  },
  closeButton: {
    margin: 0,
  },
  item: { 
    marginBottom: 8,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1 },
  actions: { alignItems: 'flex-end' },
  itemName: {
    color: '#000000',
    fontWeight: '600',
  },
  quantityText: {
    color: '#000000',
    marginTop: 4,
  },
  priceText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  customizationText: { 
    color: '#000000', 
    marginTop: 4,
    opacity: 0.8,
  },
  noteText: {
    color: '#000000',
    marginTop: 4,
    fontStyle: 'italic',
  },
  empty: { textAlign: 'center', marginVertical: 32, color: '#000000' },
  footer: { 
    marginTop: 16, 
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
  },
  totalText: {
    color: '#000000',
    fontWeight: '300',
    fontFamily: Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : undefined,
  },
  checkoutButton: {
    borderRadius: 8,
  },
});
