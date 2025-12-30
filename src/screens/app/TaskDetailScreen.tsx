import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../routes/appstack';
import {
  getTask,
  toggleTaskComplete,
  deleteTask,
} from '../../services/taskService';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeleteIcon from '../../components/icons/DeleteIcon';

type TaskDetailScreenRouteProp = RouteProp<AppStackParamList, 'TaskDetail'>;

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
}

const DetailSkeletonLoader = () => {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonTitle, { opacity }]} />
        <Animated.View style={[styles.skeletonPriority, { opacity }]} />
      </View>
      <View style={styles.content}>
        <Animated.View style={[styles.skeletonSection, { opacity }]} />
        <Animated.View style={[styles.skeletonSection, { opacity }]} />
        <Animated.View style={[styles.skeletonSection, { opacity }]} />
        <Animated.View style={[styles.skeletonButton, { opacity }]} />
      </View>
    </ScrollView>
  );
};

const TaskDetailScreen = () => {
  const route = useRoute<TaskDetailScreenRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { task: routeTask, onToggleComplete: routeOnToggleComplete } =
    route.params || {};
  const [task, setTask] = useState<Task | null>(routeTask || null);
  const [loading, setLoading] = useState(!routeTask);

  const loadTask = useCallback(async () => {
    if (routeTask) {
      setTask(routeTask);
      setLoading(false);
      return;
    }

    const taskId = (route.params as any)?.taskId;
    if (!taskId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getTask(taskId);
      if (result.success && result.task) {
        const taskData = result.task as any;
        setTask({
          id: taskData.id,
          title: taskData.title || '',
          description: taskData.description || '',
          dueDate: taskData.dueDate || '',
          priority: taskData.priority || 'medium',
          category: taskData.category || '',
          completed: taskData.completed || false,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error!',
          text2: result.error || 'Task not found',
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
  }, [routeTask, route.params]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleToggleComplete = async () => {
    if (!task) return;

    setTask({ ...task, completed: !task.completed });

    try {
      const result = await toggleTaskComplete(task.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: `Task marked as ${
            result.completed ? 'completed' : 'incomplete'
          }`,
        });
        if (routeOnToggleComplete) {
          routeOnToggleComplete(task.id);
        }
      } else {
        setTask({ ...task, completed: !task.completed });
        Toast.show({
          type: 'error',
          text1: 'Error!',
          text2: result.error || 'Failed to update task',
        });
      }
    } catch (error) {
      setTask({ ...task, completed: !task.completed });
      Toast.show({
        type: 'error',
        text1: 'Error!',
        text2:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleDeleteTask = () => {
    if (!task) return;

    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteTask(task.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success!',
                  text2: 'Task deleted successfully',
                });
                navigation.goBack();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error!',
                  text2: result.error || 'Failed to delete task',
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error!',
                text2:
                  error instanceof Error
                    ? error.message
                    : 'An unknown error occurred',
              });
            }
          },
        },
      ],
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff5252';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#999';
    }
  };

  if (loading) {
    return <DetailSkeletonLoader />;
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, task.completed && styles.completedTitle]}>
            {task.title}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          >
            <Text style={styles.priorityText}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        {task.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Completed</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {task.description ? (
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{task.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, styles.statusValue]}>
            {task.completed ? 'Completed' : 'In Progress'}
          </Text>
        </View>

        {task.dueDate ? (
          <View style={styles.section}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{task.dueDate}</Text>
          </View>
        ) : null}

        {task.category ? (
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View
            style={[
              styles.priorityBadgeLarge,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          >
            <Text style={styles.priorityTextLarge}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              task.completed
                ? styles.completeButtonActive
                : styles.completeButtonInactive,
            ]}
            onPress={handleToggleComplete}
          >
            <Text
              style={[
                styles.completeButtonText,
                task.completed && styles.completeButtonTextActive,
              ]}
            >
              {task.completed ? '✓ Mark as Incomplete' : '✓ Mark as Complete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteTask}
          >
            <DeleteIcon color="#fff" size={20} />
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  statusValue: {
    fontWeight: '600',
    color: '#6200ee',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '500',
  },
  priorityBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priorityTextLarge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
    marginTop: 40,
  },
  actionSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  completeButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  completeButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#ff9800',
  },
  completeButtonInactive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  completeButtonTextActive: {
    color: '#ff9800',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5252',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  skeletonTitle: {
    height: 32,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  skeletonPriority: {
    height: 24,
    width: 80,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  skeletonSection: {
    height: 60,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 24,
  },
  skeletonButton: {
    height: 56,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginTop: 24,
  },
});

export default TaskDetailScreen;
