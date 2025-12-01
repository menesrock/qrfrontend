import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton, Chip } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TaskNotificationCardProps {
  id: string;
  type: 'order' | 'call';
  tableName: string;
  customerName: string;
  message: string;
  createdAt: string;
  claimedBy?: string | null;
  currentUserId?: string;
  onClaim: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const TaskNotificationCard: React.FC<TaskNotificationCardProps> = ({
  id,
  type,
  tableName,
  customerName,
  message,
  createdAt,
  claimedBy,
  currentUserId,
  onClaim,
  onComplete,
  onSkip,
  onClose,
}) => {
  const isClaimed = !!claimedBy;
  const isClaimedByMe = claimedBy === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr });

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Chip style={[styles.typeChip, type === 'order' ? styles.orderChip : styles.callChip]}>
              {type === 'order' ? 'Sipariş' : 'Garson Çağrısı'}
            </Chip>
            {isClaimed && (
              <Chip style={styles.claimedChip}>
                {isClaimedByMe ? 'Siz devraldınız' : 'Başka garson devraldı'}
              </Chip>
            )}
          </View>
          <IconButton
            icon="close"
            size={20}
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
        
        <Text variant="titleMedium" style={styles.tableName}>
          Masa {tableName}
        </Text>
        <Text variant="bodyMedium" style={styles.customerName}>
          {customerName}
        </Text>
        <Text variant="bodySmall" style={styles.message}>
          {message}
        </Text>
        <Text variant="bodySmall" style={styles.timeAgo}>
          {timeAgo}
        </Text>

        <View style={styles.actions}>
          {!isClaimed ? (
            <>
              <Button
                mode="contained"
                onPress={onClaim}
                style={[styles.button, styles.claimButton]}
                icon="hand-back-left"
              >
                Görevi Devral
              </Button>
              <Button
                mode="outlined"
                onPress={onSkip}
                style={[styles.button, styles.skipButton]}
              >
                Atla
              </Button>
            </>
          ) : isClaimedByMe ? (
            <>
              <Button
                mode="contained"
                onPress={onComplete}
                style={[styles.button, styles.completeButton]}
                icon="check"
              >
                Görev Tamamlandı
              </Button>
              <Button
                mode="outlined"
                onPress={onSkip}
                style={[styles.button, styles.skipButton]}
                icon="arrow-left"
              >
                Geri Bırak
              </Button>
            </>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  typeChip: {
    height: 24,
  },
  orderChip: {
    backgroundColor: '#4CAF50',
  },
  callChip: {
    backgroundColor: '#FF9800',
  },
  claimedChip: {
    backgroundColor: '#9E9E9E',
    height: 24,
  },
  closeButton: {
    margin: 0,
  },
  tableName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  customerName: {
    marginBottom: 4,
    color: '#666',
  },
  message: {
    marginBottom: 8,
    color: '#1A1A1A',
  },
  timeAgo: {
    color: '#999',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    borderColor: '#666',
  },
});

