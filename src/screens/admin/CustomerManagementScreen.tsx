import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Text, Card, Searchbar, Chip, Appbar, IconButton, DataTable, Portal, Dialog, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { customersService, Customer } from '../../services/customers.service';
import { UI_COLORS } from '../../config/constants';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export const CustomerManagementScreen = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lastVisitAt' | 'totalSpent' | 'visitCount'>('lastVisitAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, [search, sortBy, sortOrder, page]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
      const interval = setInterval(() => {
        loadCustomers();
      }, 15000); // 15 saniyede bir otomatik refresh
      return () => clearInterval(interval);
    }, [search, sortBy, sortOrder, page])
  );

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersService.getAll({
        search: search || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      });
      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load customers:', error);
      Alert.alert('Error', 'Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCustomers();
    showToast('Yenilendi', 'success');
  };

  const handleExportToExcel = async () => {
    try {
      if (Platform.OS !== 'web') {
        Alert.alert('Bilgi', 'Excel export sadece web platformunda kullanılabilir');
        return;
      }

      showToast('Excel dosyası hazırlanıyor...', 'info');

      // Tüm müşterileri al (sayfalama olmadan)
      const response = await customersService.getAll({
        search: search || undefined,
        sortBy,
        sortOrder,
        page: 1,
        limit: 10000, // Tüm kayıtları al
      });

      const allCustomers = response.data;

      // Excel için veri formatla
      const excelData = allCustomers.map((customer, index) => ({
        'Sıra No': index + 1,
        'Email': customer.email,
        'Email İzni': customer.emailConsent ? 'Evet' : 'Hayır',
        'Ziyaret Sayısı': customer.visitCount,
        'Toplam Harcama (₺)': customer.totalSpent.toFixed(2),
        'Ortalama Harcama (₺)': customer.visitCount > 0 
          ? (customer.totalSpent / customer.visitCount).toFixed(2) 
          : '0.00',
        'Sipariş Sayısı': customer.orderCount || 0,
        'İlk Ziyaret': customer.firstVisitAt 
          ? new Date(customer.firstVisitAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
        'Son Ziyaret': customer.lastVisitAt
          ? new Date(customer.lastVisitAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Hiç gelmedi',
        'Kayıt Tarihi': new Date(customer.createdAt).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));

      // Excel workbook oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteriler');

      // Kolon genişliklerini ayarla
      const columnWidths = [
        { wch: 8 },   // Sıra No
        { wch: 30 },  // Email
        { wch: 12 },  // Email İzni
        { wch: 12 },  // Ziyaret Sayısı
        { wch: 18 },  // Toplam Harcama
        { wch: 18 },  // Ortalama Harcama
        { wch: 14 },  // Sipariş Sayısı
        { wch: 20 },  // İlk Ziyaret
        { wch: 20 },  // Son Ziyaret
        { wch: 20 },  // Kayıt Tarihi
      ];
      worksheet['!cols'] = columnWidths;

      // Dosya adı oluştur
      const fileName = `musteriler_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);

      showToast(`${allCustomers.length} müşteri Excel'e aktarıldı`, 'success');
    } catch (error: any) {
      console.error('Excel export error:', error);
      Alert.alert('Hata', 'Excel dosyası oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
      showToast('Excel export başarısız', 'error');
    }
  };

  const handleSort = (field: 'lastVisitAt' | 'totalSpent' | 'visitCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiç gelmedi';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: tr });
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <Card 
      style={styles.card} 
      onPress={() => {
        setSelectedCustomer(item);
        setDetailDialogVisible(true);
      }}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.customerEmail}>
            {item.email}
          </Text>
          {item.emailConsent && (
            <Chip icon="email-check" compact style={styles.consentChip}>
              İzinli
            </Chip>
          )}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Ziyaret</Text>
            <Text variant="titleMedium" style={styles.statValue}>{item.visitCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Toplam Harcama</Text>
            <Text variant="titleMedium" style={styles.statValue}>
              {formatCurrency(item.totalSpent)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Son Ziyaret</Text>
            <Text variant="bodySmall" style={styles.statValue}>
              {formatDate(item.lastVisitAt)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Müşteri Yönetimi (CRM)" />
        <IconButton
          icon="file-excel"
          iconColor={UI_COLORS.primary}
          size={24}
          onPress={handleExportToExcel}
        />
        <IconButton
          icon="refresh"
          iconColor={UI_COLORS.primary}
          size={24}
          onPress={handleRefresh}
        />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Email ile ara..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          inputStyle={{ color: UI_COLORS.textPrimary }}
        />
      </View>

      <View style={styles.sortContainer}>
        <Text variant="bodyMedium" style={styles.sortLabel}>Sırala:</Text>
        <Chip
          selected={sortBy === 'lastVisitAt'}
          onPress={() => handleSort('lastVisitAt')}
          style={styles.sortChip}
          icon={sortBy === 'lastVisitAt' ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down') : undefined}
        >
          Son Ziyaret
        </Chip>
        <Chip
          selected={sortBy === 'totalSpent'}
          onPress={() => handleSort('totalSpent')}
          style={styles.sortChip}
          icon={sortBy === 'totalSpent' ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down') : undefined}
        >
          Toplam Harcama
        </Chip>
        <Chip
          selected={sortBy === 'visitCount'}
          onPress={() => handleSort('visitCount')}
          style={styles.sortChip}
          icon={sortBy === 'visitCount' ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down') : undefined}
        >
          Ziyaret Sayısı
        </Chip>
      </View>

      {loading && customers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Müşteri bulunamadı</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerCard}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={loadCustomers}
          />
          <View style={styles.pagination}>
            <Button
              mode="outlined"
              onPress={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Önceki
            </Button>
            <Text style={styles.pageInfo}>
              Sayfa {page} / {totalPages}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Sonraki
            </Button>
          </View>
        </>
      )}

      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
        >
          <Dialog.Title>Müşteri Detayları</Dialog.Title>
          <Dialog.Content>
            {selectedCustomer && (
              <ScrollView>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email İzni:</Text>
                  <Chip
                    icon={selectedCustomer.emailConsent ? 'check-circle' : 'close-circle'}
                    style={styles.detailChip}
                  >
                    {selectedCustomer.emailConsent ? 'İzinli' : 'İzinsiz'}
                  </Chip>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ziyaret Sayısı:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.visitCount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Toplam Harcama:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>İlk Ziyaret:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedCustomer.firstVisitAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Son Ziyaret:</Text>
                  <Text style={styles.detailValue}>
                    {selectedCustomer.lastVisitAt
                      ? new Date(selectedCustomer.lastVisitAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Hiç gelmedi'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kayıt Tarihi:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailDialogVisible(false)}>Kapat</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  header: {
    backgroundColor: UI_COLORS.surface,
    elevation: 0,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  search: {
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sortLabel: {
    color: UI_COLORS.textSecondary,
    marginRight: 8,
  },
  sortChip: {
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerEmail: {
    color: UI_COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  consentChip: {
    backgroundColor: '#E8F5E9',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: UI_COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    color: UI_COLORS.textPrimary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: UI_COLORS.textSecondary,
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  pageInfo: {
    color: UI_COLORS.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  detailLabel: {
    color: UI_COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    color: UI_COLORS.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  detailChip: {
    backgroundColor: '#E8F5E9',
  },
});

