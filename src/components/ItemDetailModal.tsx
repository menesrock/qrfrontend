import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  Checkbox,
  RadioButton,
} from 'react-native-paper';
import { Customization, MenuItem } from '../types';
import { customizationsService } from '../services';

interface ItemDetailModalProps {
  visible: boolean;
  item: MenuItem | null;
  onDismiss: () => void;
  onAddToCart: (item: any) => void;
}

type SelectionMap = Record<string, string[]>;

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onDismiss,
  onAddToCart,
}) => {
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);
  const [selectionMap, setSelectionMap] = useState<SelectionMap>({});

  useEffect(() => {
    let isMounted = true;
    const loadCustomizations = async () => {
      if (!item || !visible) return;
      setLoadingCustomizations(true);
      try {
        const data =
          item.customizations && item.customizations.length > 0
            ? item.customizations
            : await customizationsService.getByMenuItem(item.id);
        if (!isMounted) return;
        setCustomizations(data);
        setSelectionMap(() => {
          const defaults: SelectionMap = {};
          data.forEach((c) => {
            const defaultOptions = c.options
              .filter((o) => o.isDefault)
              .map((o) => o.name);
            if (defaultOptions.length > 0) {
              defaults[c.id] = defaultOptions;
            } else {
              defaults[c.id] = [];
            }
          });
          return defaults;
        });
      } catch (error) {
        console.error('Failed to load customizations', error);
      } finally {
        if (isMounted) {
          setLoadingCustomizations(false);
        }
      }
    };

    if (visible && item) {
      loadCustomizations();
    } else {
      setCustomizations([]);
      setSelectionMap({});
      setQuantity(1);
      setNotes('');
    }

    return () => {
      isMounted = false;
    };
  }, [visible, item]);

  const toggleOption = (customizationId: string, optionName: string, allowMultiple: boolean) => {
    setSelectionMap((prev) => {
      const current = prev[customizationId] || [];
      if (allowMultiple) {
        return {
          ...prev,
          [customizationId]: current.includes(optionName)
            ? current.filter((name) => name !== optionName)
            : [...current, optionName],
        };
      }
      return {
        ...prev,
        [customizationId]: [optionName],
      };
    });
  };

  const requirementsSatisfied = useMemo(() => {
    if (!item) return true;
    return customizations.every((c) => {
      if (!c.required) return true;
      return (selectionMap[c.id] || []).length > 0;
    });
  }, [customizations, selectionMap, item]);

  const extraCost = useMemo(() => {
    if (!item) return 0;
    return customizations.reduce((sum, c) => {
      const selectedNames = selectionMap[c.id] || [];
      const selectedOptions = c.options.filter((o) => selectedNames.includes(o.name));
      const optionCost = selectedOptions.reduce((acc, option) => acc + (option.price || 0), 0);
      return sum + optionCost;
    }, 0);
  }, [customizations, selectionMap, item]);

  const buildCustomizationPayload = () => {
    if (!item) return [];
    return customizations
      .map((c) => {
        const selectedNames = selectionMap[c.id] || [];
        if (!selectedNames.length) return null;
        const selectedOptions = c.options.filter((o) => selectedNames.includes(o.name));
        return {
          customizationId: c.id,
          name: c.name,
          type: c.type,
          selectedOptions: selectedOptions.map((o) => ({
            name: o.name,
            price: o.price,
          })),
        };
      })
      .filter(Boolean);
  };

  if (!item) {
    return null;
  }

  const handleAdd = () => {
    const customizationsPayload = buildCustomizationPayload();
    const basePrice = item.price;
    const linePrice = (basePrice + extraCost) * quantity;

    onAddToCart({
      ...item,
      quantity,
      notes,
      customizations: customizationsPayload,
      extraCost,
      lineTotal: linePrice,
    });
    setNotes('');
    setQuantity(1);
    onDismiss();
  };

  const renderCustomization = (customization: Customization) => {
    const selected = selectionMap[customization.id] || [];
    const allowMultiple = customization.allowMultiple || customization.type === 'extra';
    const isRadio = !allowMultiple;

    return (
      <View key={customization.id} style={styles.section}>
        <Text variant="titleMedium">{customization.name}</Text>
        <Text variant="bodySmall" style={styles.customizationHint}>
          {customization.type.toUpperCase()} • {customization.required ? 'Required' : 'Optional'}
        </Text>
        {isRadio ? (
          <RadioButton.Group
            onValueChange={(value) => toggleOption(customization.id, value, false)}
            value={selected[0] || ''}
          >
            {customization.options.map((option) => (
              <RadioButton.Item
                key={`${customization.id}-${option.name}`}
                label={`${option.name}${option.price ? ` (+₺${option.price})` : ''}`}
                value={option.name}
              />
            ))}
          </RadioButton.Group>
        ) : (
          customization.options.map((option) => (
            <Checkbox.Item
              key={`${customization.id}-${option.name}`}
              label={`${option.name}${option.price ? ` (+₺${option.price})` : ''}`}
              status={selected.includes(option.name) ? 'checked' : 'unchecked'}
              onPress={() => toggleOption(customization.id, option.name, true)}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={styles.modal}
        style={styles.modalWrapper}
      >
        <ScrollView>
          <Text variant="headlineMedium">{item.name}</Text>
          <Text variant="titleLarge" style={styles.price}>
            ${(item.price + extraCost).toFixed(2)}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
          
          {item.allergens?.length ? (
            <View style={styles.section}>
              <Text variant="titleSmall">Allergens</Text>
              <View style={styles.chips}>
                {item.allergens.map((a) => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </View>
            </View>
          ) : null}

          {loadingCustomizations ? (
            <ActivityIndicator style={{ marginVertical: 16 }} />
          ) : (
            customizations.map(renderCustomization)
          )}

          <TextInput
            label="Special Notes (max 500 chars)"
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.quantity}>
            <Button onPress={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <Text variant="titleLarge">{quantity}</Text>
            <Button onPress={() => setQuantity(quantity + 1)}>+</Button>
          </View>

          <Button
            mode="contained"
            onPress={handleAdd}
            style={styles.button}
            disabled={!requirementsSatisfied || loadingCustomizations}
          >
            Add to Cart - ${(item.price + extraCost) * quantity > 0
              ? ((item.price + extraCost) * quantity).toFixed(2)
              : item.price.toFixed(2)}
          </Button>
        </ScrollView>
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }),
  },
  modal: { 
    backgroundColor: 'white', 
    padding: 20, 
    margin: 20, 
    borderRadius: 8, 
    maxHeight: '90%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    width: Platform.OS === 'web' ? '90%' : '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      position: 'relative' as any,
    }),
  },
  price: { color: '#6200EE', marginVertical: 8 },
  description: { marginBottom: 16 },
  section: { marginVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  customizationHint: { color: '#666' },
  input: { marginVertical: 12 },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 12,
  },
  button: { marginTop: 16 },
});
