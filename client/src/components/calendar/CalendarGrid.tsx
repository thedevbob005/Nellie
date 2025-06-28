import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ScheduledPost {
  id: number;
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  platforms: string[];
}

interface CalendarGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  scheduledPosts: ScheduledPost[];
  viewMode: 'month' | 'week' | 'day';
}

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 32) / 7; // Account for padding

const CalendarGrid: React.FC<CalendarGridProps> = ({
  selectedDate,
  onDateSelect,
  scheduledPosts,
  viewMode,
}) => {
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getSingleDay = (date: Date): Date[] => {
    return [new Date(date)];
  };

  const getDays = (): Date[] => {
    switch (viewMode) {
      case 'month':
        return getDaysInMonth(selectedDate);
      case 'week':
        return getWeekDays(selectedDate);
      case 'day':
        return getSingleDay(selectedDate);
      default:
        return getDaysInMonth(selectedDate);
    }
  };

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    const dateString = date.toDateString();
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === dateString;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return '#2196F3';
      case 'published':
        return '#4CAF50';
      case 'failed':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getPlatformIcon = (platform: string): string => {
    const icons = {
      facebook: 'facebook',
      instagram: 'camera-alt',
      twitter: 'chat',
      linkedin: 'business',
      youtube: 'play-arrow',
      threads: 'forum',
    };
    return icons[platform as keyof typeof icons] || 'public';
  };

  const renderDayHeader = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.dayHeader}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthHeader = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const goToPreviousMonth = () => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(selectedDate.getMonth() - 1);
      onDateSelect(newDate);
    };
    
    const goToNextMonth = () => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(selectedDate.getMonth() + 1);
      onDateSelect(newDate);
    };
    
    return (
      <View style={styles.monthHeader}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
          <Icon name="chevron-left" size={24} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        
        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDayCell = (date: Date, index: number) => {
    const posts = getPostsForDate(date);
    const dayNumber = date.getDate();
    const isCurrentMonthDay = isCurrentMonth(date);
    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !isCurrentMonthDay && styles.dayCellInactive,
          isTodayDate && styles.dayCellToday,
          isSelectedDate && styles.dayCellSelected,
        ]}
        onPress={() => onDateSelect(date)}
      >
        <Text style={[
          styles.dayNumber,
          !isCurrentMonthDay && styles.dayNumberInactive,
          isTodayDate && styles.dayNumberToday,
          isSelectedDate && styles.dayNumberSelected,
        ]}>
          {dayNumber}
        </Text>
        
        {posts.length > 0 && (
          <View style={styles.postsIndicator}>
            {posts.slice(0, 3).map((post, postIndex) => (
              <View
                key={postIndex}
                style={[
                  styles.postDot,
                  { backgroundColor: getStatusColor(post.status) }
                ]}
              />
            ))}
            {posts.length > 3 && (
              <Text style={styles.morePostsText}>+{posts.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWeekView = () => {
    const days = getDays();
    
    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          {days.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayHeader,
                isSelected(date) && styles.weekDayHeaderSelected,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[
                styles.weekDayName,
                isSelected(date) && styles.weekDayNameSelected,
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                isToday(date) && styles.weekDayNumberToday,
                isSelected(date) && styles.weekDayNumberSelected,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView style={styles.weekContent}>
          {days.map((date, index) => {
            const posts = getPostsForDate(date);
            return (
              <View key={index} style={styles.weekDayContent}>
                {posts.map((post, postIndex) => (
                  <View key={postIndex} style={styles.weekPostItem}>
                    <View style={[
                      styles.weekPostStatus,
                      { backgroundColor: getStatusColor(post.status) }
                    ]} />
                    <Text style={styles.weekPostTime}>
                      {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    <View style={styles.weekPostPlatforms}>
                      {post.platforms.slice(0, 2).map((platform, platformIndex) => (
                        <Icon
                          key={platformIndex}
                          name={getPlatformIcon(platform)}
                          size={12}
                          color="#666"
                          style={styles.weekPostPlatformIcon}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    const posts = getPostsForDate(selectedDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <View style={styles.dayContainer}>
        <View style={styles.dayViewHeader}>
          <Text style={styles.dayViewTitle}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        <ScrollView style={styles.dayContent}>
          {hours.map((hour) => {
            const hourPosts = posts.filter(post => {
              const postHour = new Date(post.scheduled_at).getHours();
              return postHour === hour;
            });
            
            return (
              <View key={hour} style={styles.hourSlot}>
                <Text style={styles.hourLabel}>
                  {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </Text>
                <View style={styles.hourContent}>
                  {hourPosts.map((post, postIndex) => (
                    <View key={postIndex} style={styles.dayPostItem}>
                      <View style={[
                        styles.dayPostStatus,
                        { backgroundColor: getStatusColor(post.status) }
                      ]} />
                      <Text style={styles.dayPostTime}>
                        {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <View style={styles.dayPostPlatforms}>
                        {post.platforms.map((platform, platformIndex) => (
                          <Icon
                            key={platformIndex}
                            name={getPlatformIcon(platform)}
                            size={14}
                            color="#666"
                            style={styles.dayPostPlatformIcon}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMonthView = () => {
    const days = getDays();
    const weeks: Date[][] = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <View style={styles.monthContainer}>
        {renderMonthHeader()}
        {renderDayHeader()}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((date, dayIndex) => renderDayCell(date, dayIndex))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  monthContainer: {
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: '#e3f2fd',
  },
  dayCellSelected: {
    backgroundColor: '#2196F3',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dayNumberInactive: {
    color: '#999',
  },
  dayNumberToday: {
    color: '#2196F3',
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  postsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  postDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2,
    marginBottom: 2,
  },
  morePostsText: {
    fontSize: 8,
    color: '#666',
    marginLeft: 2,
  },
  weekContainer: {
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  weekDayHeaderSelected: {
    backgroundColor: '#2196F3',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  weekDayNameSelected: {
    color: '#fff',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  weekDayNumberToday: {
    color: '#2196F3',
  },
  weekDayNumberSelected: {
    color: '#fff',
  },
  weekContent: {
    maxHeight: 300,
  },
  weekDayContent: {
    marginBottom: 8,
  },
  weekPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  weekPostStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  weekPostTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  weekPostPlatforms: {
    flexDirection: 'row',
  },
  weekPostPlatformIcon: {
    marginRight: 4,
  },
  dayContainer: {
    padding: 16,
  },
  dayViewHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  dayViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dayContent: {
    maxHeight: 400,
  },
  hourSlot: {
    flexDirection: 'row',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hourLabel: {
    width: 60,
    fontSize: 12,
    color: '#666',
    paddingTop: 4,
  },
  hourContent: {
    flex: 1,
    paddingLeft: 8,
  },
  dayPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  dayPostStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dayPostTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  dayPostPlatforms: {
    flexDirection: 'row',
  },
  dayPostPlatformIcon: {
    marginRight: 6,
  },
});

export default CalendarGrid; 