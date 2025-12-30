import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCurrentUser,
  getUserData,
  signOut,
} from '../../services/authService';
import Toast from 'react-native-toast-message';

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface UserData {
  name: string;
  email: string;
  createdAt: FirestoreTimestamp;
}

const SkeletonLoader = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <>
      <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      <Animated.View style={[styles.skeletonName, { opacity }]} />
      <Animated.View style={[styles.skeletonEmail, { opacity }]} />
    </>
  );
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const [userData, setUserData] = useState<UserData | null>(null);

  const loadUserData = useCallback(async () => {
    if (user) {
      const result = await getUserData(user.uid);
      if (result.success) {
        setUserData(result.data as UserData);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const result = await signOut();
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Logged out successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error!',
          text2: result.error || 'Failed to logout',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error!',
        text2:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.profileHeader,
          {
            paddingTop: Math.max(insets.top + 32, 32),
            paddingBottom: 32,
          },
        ]}
      >
        {loading ? (
          <SkeletonLoader />
        ) : (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.name ? getInitials(userData.name) : 'U'}
              </Text>
            </View>
            <Text style={styles.name}>
              {userData?.name || user?.displayName || 'User'}
            </Text>
            <Text style={styles.email}>
              {userData?.email || user?.email || 'No email'}
            </Text>
          </>
        )}
      </View>

      <View
        style={[
          styles.menu,
          { paddingBottom: Math.max(insets.bottom, 0) + 80 },
        ]}
      >
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  menu: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  menuItem: {
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#ff5252',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  skeletonName: {
    width: 150,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  skeletonEmail: {
    width: 200,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
});

export default ProfileScreen;
