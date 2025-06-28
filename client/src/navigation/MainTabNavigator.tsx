// Main Tab Navigator for Authenticated Users
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

// Import screen components
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import PostsScreen from '../screens/posts/PostsScreen';
import ClientsScreen from '../screens/clients/ClientsScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ApprovalScreen from '../screens/approval/ApprovalScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user?.role === 'manager';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Posts':
              iconName = focused ? 'create' : 'create-outline';
              break;
            case 'Clients':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Approvals':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      
      <Tab.Screen 
        name="Posts" 
        component={PostsScreen}
        options={{ title: 'Posts' }}
      />
      
      <Tab.Screen 
        name="Clients" 
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      
      {/* Show Approvals tab only for managers */}
      {isManager && (
        <Tab.Screen 
          name="Approvals" 
          component={ApprovalScreen}
          options={{ title: 'Approvals' }}
        />
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 