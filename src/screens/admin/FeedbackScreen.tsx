import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, Appbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { feedbackService } from '../../services/feedback.service';
import { Feedback } from '../../types';
import { useToast } from '../../contexts/ToastContext';

type DateFilter = 'daily' | 'weekly' | 'monthly' | 'all';

export const FeedbackScreen = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadFeedback();
  }, [dateFilter]);

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
      const interval = setInterval(() => {
        loadFeedback();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [dateFilter])
  );

  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const endDate = now.toISOString();

    switch (dateFilter) {
      case 'daily':
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        return { startDate: dayStart.toISOString(), endDate };
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return { startDate: weekStart.toISOString(), endDate };
      case 'monthly':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        return { startDate: monthStart.toISOString(), endDate };
      default:
        return {};
    }
  };

  const loadFeedback = async () => {
    try {
      const dateRange = getDateRange();
      const data = await feedbackService.getAll(dateRange);
      setFeedback(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (feedback.length === 0) {
      return { service: 0, hygiene: 0, product: 0, overall: 0 };
    }

    const totals = feedback.reduce(
      (acc, item) => ({
        service: acc.service + item.ratings.service,
        hygiene: acc.hygiene + item.ratings.hygiene,
        product: acc.product + item.ratings.product,
        overall: acc.overall + item.ratings.overall,
      }),
      { service: 0, hygiene: 0, product: 0, overall: 0 }
    );

    return {
      service: (totals.service / feedback.length).toFixed(1),
      hygiene: (totals.hygiene / feedback.length).toFixed(1),
      product: (totals.product / feedback.length).toFixed(1),
      overall: (totals.overall / feedback.length).toFixed(1),
    };
  };

  const handleExport = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'CSV export is only available on web');
      return;
    }

    setExporting(true);
    try {
      const dateRange = getDateRange();
      const blob = await feedbackService.exportCSV(dateRange);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Alert.alert('Success', 'Feedback exported successfully');
    } catch (error) {
      console.error('Failed to export feedback:', error);
      Alert.alert('Error', 'Failed to export feedback');
    } finally {
      setExporting(false);
    }
  };

  const averages = calculateAverages();

  const renderFeedback = ({ item }: { item: Feedback }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">Order #{item.orderId.slice(0, 8)}</Text>
          <Text variant="bodySmall">{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.ratings}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Service:</Text>
            <Chip compact>{item.ratings.service}/5</Chip>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Hygiene:</Text>
            <Chip compact>{item.ratings.hygiene}/5</Chip>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Product:</Text>
            <Chip compact>{item.ratings.product}/5</Chip>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Overall:</Text>
            <Chip compact>{item.ratings.overall}/5</Chip>
          </View>
        </View>

        {item.comment && (
          <View style={styles.comment}>
            <Text variant="bodySmall" style={styles.commentLabel}>
              Comment:
            </Text>
            <Text variant="bodyMedium">{item.comment}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Feedback & Reports" />
        <IconButton
          icon="refresh"
          iconColor="#6200EE"
          size={24}
          onPress={() => {
            loadFeedback();
            showToast('Yenilendi', 'success');
          }}
        />
      </Appbar.Header>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.statsTitle}>
            Average Ratings
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{averages.service}</Text>
              <Text variant="bodySmall">Service</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{averages.hygiene}</Text>
              <Text variant="bodySmall">Hygiene</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{averages.product}</Text>
              <Text variant="bodySmall">Product</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{averages.overall}</Text>
              <Text variant="bodySmall">Overall</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.filters}>
        <SegmentedButtons
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as DateFilter)}
          buttons={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleExport}
          loading={exporting}
          disabled={exporting || feedback.length === 0}
          icon="download"
        >
          Export CSV
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.listTitle}>
        Feedback ({feedback.length})
      </Text>

      <FlatList
        data={feedback}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedback}
        refreshing={loading}
        onRefresh={loadFeedback}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No feedback available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { backgroundColor: '#fff', elevation: 0 },
  title: {
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  filters: {
    marginBottom: 16,
  },
  actions: {
    marginBottom: 16,
  },
  listTitle: {
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratings: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    flex: 1,
  },
  comment: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  commentLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});
