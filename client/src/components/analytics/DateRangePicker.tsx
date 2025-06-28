import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (dateRange: { startDate: Date; endDate: Date }) => void;
}

interface PresetRange {
  label: string;
  days: number;
  icon: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presetRanges: PresetRange[] = [
    { label: 'Last 7 days', days: 7, icon: 'today' },
    { label: 'Last 14 days', days: 14, icon: 'view-week' },
    { label: 'Last 30 days', days: 30, icon: 'date-range' },
    { label: 'Last 90 days', days: 90, icon: 'calendar-today' },
    { label: 'Last 6 months', days: 180, icon: 'event' },
    { label: 'Last year', days: 365, icon: 'schedule' },
  ];

  const formatDateRange = (): string => {
    const start = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const end = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    
    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${start}, ${startDate.getFullYear()} - ${end}, ${endDate.getFullYear()}`;
    }
    
    return `${start} - ${end}, ${endDate.getFullYear()}`;
  };

  const getCurrentPreset = (): string | null => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const preset = presetRanges.find(range => range.days === diffDays);
    return preset ? preset.label : null;
  };

  const handlePresetSelect = (preset: PresetRange) => {
    const newEndDate = new Date();
    const newStartDate = new Date();
    newStartDate.setDate(newStartDate.getDate() - preset.days);
    
    onDateRangeChange({
      startDate: newStartDate,
      endDate: newEndDate,
    });
    
    setSelectedPreset(preset.label);
    setModalVisible(false);
  };

  const handleCustomRange = () => {
    Alert.alert(
      'Custom Date Range',
      'Custom date picker functionality would be implemented here with a calendar component.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK' },
      ]
    );
  };

  const getDaysDifference = (): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderPresetOption = (preset: PresetRange) => {
    const isSelected = getCurrentPreset() === preset.label;
    
    return (
      <TouchableOpacity
        key={preset.label}
        style={[styles.presetOption, isSelected && styles.presetOptionSelected]}
        onPress={() => handlePresetSelect(preset)}
      >
        <View style={[styles.presetIcon, isSelected && styles.presetIconSelected]}>
          <Icon 
            name={preset.icon} 
            size={20} 
            color={isSelected ? '#fff' : '#666'} 
          />
        </View>
        
        <View style={styles.presetInfo}>
          <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
            {preset.label}
          </Text>
          <Text style={[styles.presetDays, isSelected && styles.presetDaysSelected]}>
            {preset.days} days
          </Text>
        </View>
        
        {isSelected && (
          <Icon name="check-circle" size={20} color="#2196F3" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.dateRangeDisplay}>
          <Icon name="date-range" size={20} color="#666" />
          <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
          <Text style={styles.dayCount}>({getDaysDifference()} days)</Text>
        </View>
        <Icon name="expand-more" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.presetsList} showsVerticalScrollIndicator={false}>
              <View style={styles.presetsSection}>
                <Text style={styles.sectionTitle}>Quick Select</Text>
                {presetRanges.map(renderPresetOption)}
              </View>

              <View style={styles.customSection}>
                <Text style={styles.sectionTitle}>Custom Range</Text>
                <TouchableOpacity
                  style={styles.customOption}
                  onPress={handleCustomRange}
                >
                  <View style={styles.customIcon}>
                    <Icon name="edit-calendar" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.customInfo}>
                    <Text style={styles.customLabel}>Custom Date Range</Text>
                    <Text style={styles.customDescription}>
                      Pick specific start and end dates
                    </Text>
                  </View>
                  <Icon name="arrow-forward-ios" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.currentSelection}>
                <Text style={styles.currentSelectionLabel}>Current Selection:</Text>
                <Text style={styles.currentSelectionText}>{formatDateRange()}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateRangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  dayCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  presetsList: {
    paddingHorizontal: 16,
  },
  presetsSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  presetOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  presetIconSelected: {
    backgroundColor: '#2196F3',
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  presetLabelSelected: {
    color: '#2196F3',
  },
  presetDays: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  presetDaysSelected: {
    color: '#1976D2',
  },
  customSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customInfo: {
    flex: 1,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  currentSelection: {
    alignItems: 'center',
  },
  currentSelectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentSelectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default DateRangePicker; 