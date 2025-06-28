import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SchedulePostModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date;
  clientId?: number | null;
  onPostScheduled: (post: any) => void;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  characterLimit: number;
}

const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    characterLimit: 63206,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'camera-alt',
    color: '#E4405F',
    characterLimit: 2200,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'chat',
    color: '#1DA1F2',
    characterLimit: 280,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'business',
    color: '#0A66C2',
    characterLimit: 1300,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'play-arrow',
    color: '#FF0000',
    characterLimit: 5000,
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: 'forum',
    color: '#000000',
    characterLimit: 500,
  },
];

const SchedulePostModal: React.FC<SchedulePostModalProps> = ({
  visible,
  onClose,
  initialDate = new Date(),
  clientId,
  onPostScheduled,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('daily');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  useEffect(() => {
    if (visible) {
      setScheduledDate(initialDate);
    }
  }, [visible, initialDate]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const getCharacterLimit = (): number => {
    if (selectedPlatforms.length === 0) return 0;
    
    const limits = selectedPlatforms.map(platformId => {
      const platform = PLATFORMS.find(p => p.id === platformId);
      return platform?.characterLimit || 0;
    });
    
    return Math.min(...limits);
  };

  const isContentValid = (): boolean => {
    const limit = getCharacterLimit();
    return content.length > 0 && (limit === 0 || content.length <= limit);
  };

  const handleSchedule = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a post title');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter post content');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }
    
    if (!isContentValid()) {
      Alert.alert('Error', 'Content exceeds character limit for selected platforms');
      return;
    }

    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      client_id: clientId || 1,
      platforms: selectedPlatforms,
      scheduled_at: scheduledDate.toISOString(),
      status: 'scheduled' as const,
      is_recurring: isRecurring,
      recurring_pattern: isRecurring ? recurringPattern : undefined,
      created_by: 1,
      created_at: new Date().toISOString(),
    };

    onPostScheduled(newPost);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setSelectedPlatforms([]);
    setIsRecurring(false);
    setRecurringPattern('daily');
    setIsAdvancedMode(false);
    onClose();
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const adjustDateTime = (type: 'date' | 'time', direction: 'up' | 'down') => {
    const newDate = new Date(scheduledDate);
    
    if (type === 'date') {
      if (direction === 'up') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else {
      if (direction === 'up') {
        newDate.setHours(newDate.getHours() + 1);
      } else {
        newDate.setHours(newDate.getHours() - 1);
      }
    }
    
    setScheduledDate(newDate);
  };

  const renderPlatformSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Platforms</Text>
      <View style={styles.platformsGrid}>
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          return (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                isSelected && { borderColor: platform.color, backgroundColor: `${platform.color}10` }
              ]}
              onPress={() => handlePlatformToggle(platform.id)}
            >
              <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                <Icon name={platform.icon} size={20} color="#fff" />
              </View>
              <Text style={[styles.platformName, isSelected && { color: platform.color }]}>
                {platform.name}
              </Text>
              {isSelected && (
                <Icon name="check-circle" size={16} color={platform.color} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDateTimeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule Date & Time</Text>
      
      <View style={styles.dateTimeContainer}>
        <Text style={styles.currentDateTime}>{formatDateTime(scheduledDate)}</Text>
        
        <View style={styles.dateTimeControls}>
          <View style={styles.dateControls}>
            <Text style={styles.controlLabel}>Date</Text>
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => adjustDateTime('date', 'down')}
              >
                <Icon name="remove" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => adjustDateTime('date', 'up')}
              >
                <Icon name="add" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.timeControls}>
            <Text style={styles.controlLabel}>Time</Text>
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => adjustDateTime('time', 'down')}
              >
                <Icon name="remove" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => adjustDateTime('time', 'up')}
              >
                <Icon name="add" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderRecurringOptions = () => (
    <View style={styles.section}>
      <View style={styles.recurringHeader}>
        <Text style={styles.sectionTitle}>Recurring Post</Text>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
          trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
          thumbColor={isRecurring ? '#fff' : '#f4f3f4'}
        />
      </View>
      
      {isRecurring && (
        <View style={styles.recurringOptions}>
          {['daily', 'weekly', 'monthly'].map((pattern) => (
            <TouchableOpacity
              key={pattern}
              style={[
                styles.recurringOption,
                recurringPattern === pattern && styles.recurringOptionSelected
              ]}
              onPress={() => setRecurringPattern(pattern)}
            >
              <Text style={[
                styles.recurringOptionText,
                recurringPattern === pattern && styles.recurringOptionTextSelected
              ]}>
                {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderContentSection = () => {
    const characterLimit = getCharacterLimit();
    const remainingChars = characterLimit > 0 ? characterLimit - content.length : 0;
    const isOverLimit = characterLimit > 0 && content.length > characterLimit;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Post Content</Text>
        
        <TextInput
          style={styles.titleInput}
          placeholder="Post title (optional)"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        
        <View style={styles.contentInputContainer}>
          <TextInput
            style={[styles.contentInput, isOverLimit && styles.contentInputError]}
            placeholder="What do you want to share?"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          
          {characterLimit > 0 && (
            <View style={styles.characterCounter}>
              <Text style={[
                styles.characterCountText,
                isOverLimit && styles.characterCountError
              ]}>
                {remainingChars} characters remaining
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Schedule Post</Text>
          
          <TouchableOpacity
            style={[styles.scheduleButton, !isContentValid() && styles.scheduleButtonDisabled]}
            onPress={handleSchedule}
            disabled={!isContentValid()}
          >
            <Text style={[
              styles.scheduleButtonText,
              !isContentValid() && styles.scheduleButtonTextDisabled
            ]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderContentSection()}
          {renderPlatformSelector()}
          {renderDateTimeSelector()}
          {renderRecurringOptions()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2196F3',
  },
  scheduleButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scheduleButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  contentInputContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  contentInput: {
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  contentInputError: {
    borderColor: '#f44336',
  },
  characterCounter: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  characterCountText: {
    fontSize: 12,
    color: '#666',
  },
  characterCountError: {
    color: '#f44336',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateTimeContainer: {
    alignItems: 'center',
  },
  currentDateTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateTimeControls: {
    flexDirection: 'row',
    gap: 24,
  },
  dateControls: {
    alignItems: 'center',
  },
  timeControls: {
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurringOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurringOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recurringOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  recurringOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  recurringOptionTextSelected: {
    color: '#fff',
  },
});

export default SchedulePostModal; 