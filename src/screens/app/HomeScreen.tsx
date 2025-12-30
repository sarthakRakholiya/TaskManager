import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { AppStackParamList } from '../../routes/appstack';
import { BottomTabParamList } from '../../routes/bottomtabs';
import AddTaskModal from '../../components/AddTaskModal';
import {
  getUserTasks,
  toggleTaskComplete,
  deleteTask,
} from '../../services/taskService';
import Toast from 'react-native-toast-message';
import DeleteIcon from '../../components/icons/DeleteIcon';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<AppStackParamList>
>;

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
}
//Task Skeleton Item
const TaskSkeletonItem = () => {
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
    <View style={styles.taskItem}>
      <View style={styles.taskContentWrapper}>
        <Animated.View style={[styles.skeletonCheckbox, { opacity }]} />
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Animated.View style={[styles.skeletonTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonPriority, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonDescription, { opacity }]} />
          <View style={styles.taskFooter}>
            <Animated.View style={[styles.skeletonDate, { opacity }]} />
            <Animated.View style={[styles.skeletonCategory, { opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

//Home Screen
const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const triggeredActions = useRef<{ [key: string]: string | null }>({});

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUserTasks();
      if (result.success && result.tasks) {
        const formattedTasks: Task[] = result.tasks.map((task: any) => ({
          id: task.id,
          title: task.title || '',
          description: task.description || '',
          dueDate: task.dueDate || '',
          priority: task.priority || 'medium',
          category: task.category || '',
          completed: task.completed || false,
        }));
        setTasks(formattedTasks);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error!',
          text2: result.error || 'Failed to load tasks',
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'completed'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      ...taskData,
      id: tempId,
      completed: false,
    };

    setTasks([optimisticTask, ...tasks]);
    await loadTasks();
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    swipeableRefs.current[taskId]?.close();

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t,
    );
    setTasks(updatedTasks);

    try {
      const result = await toggleTaskComplete(taskId);
      if (!result.success) {
        setTasks(tasks);
        Toast.show({
          type: 'error',
          text1: 'Error!',
          text2: result.error || 'Failed to update task',
        });
      }
    } catch (error) {
      setTasks(tasks);
      Toast.show({
        type: 'error',
        text1: 'Error!',
        text2:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    swipeableRefs.current[taskId]?.close();

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
            const updatedTasks = tasks.filter(t => t.id !== taskId);
            setTasks(updatedTasks);

            try {
              const result = await deleteTask(taskId);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success!',
                  text2: 'Task deleted successfully',
                });
              } else {
                setTasks(tasks);
                Toast.show({
                  type: 'error',
                  text1: 'Error!',
                  text2: result.error || 'Failed to delete task',
                });
              }
            } catch (error) {
              setTasks(tasks);
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

  const skeletonData = Array.from({ length: 5 }, (_, index) => ({
    id: `skeleton-${index}`,
  }));

  const renderSkeleton = () => <TaskSkeletonItem />;

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    task: Task,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.completeAction}>
        <Animated.View
          style={[
            styles.completeActionContent,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.actionButton}>
            <Text style={styles.completeActionIcon}>
              {task.completed ? '↶' : '✓'}
            </Text>
            <Text style={styles.completeActionText}>
              {task.completed ? 'Undo' : 'Complete'}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    _taskId: string,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteAction}>
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.actionButton}>
            <DeleteIcon color="#fff" size={24} />
            <Text style={styles.deleteActionText}>Delete</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable
      ref={ref => {
        if (ref) {
          swipeableRefs.current[item.id] = ref;
        } else {
          delete swipeableRefs.current[item.id];
        }
      }}
      renderLeftActions={(progress, dragX) =>
        renderLeftActions(progress, dragX, item)
      }
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item.id)
      }
      overshootRight={false}
      overshootLeft={false}
      friction={1}
      leftThreshold={60}
      rightThreshold={60}
      onSwipeableWillOpen={direction => {
        Object.keys(swipeableRefs.current).forEach(key => {
          if (key !== item.id) {
            swipeableRefs.current[key]?.close();
          }
        });

        const actionKey = `${item.id}-${direction}`;
        if (triggeredActions.current[actionKey]) {
          return;
        }

        triggeredActions.current[actionKey] = direction;

        if (direction === 'left') {
          handleToggleComplete(item.id);
          requestAnimationFrame(() => {
            swipeableRefs.current[item.id]?.close();
          });
        } else if (direction === 'right') {
          handleDeleteTask(item.id);
          requestAnimationFrame(() => {
            swipeableRefs.current[item.id]?.close();
          });
        }
      }}
      onSwipeableClose={() => {
        Object.keys(triggeredActions.current).forEach(key => {
          if (key.startsWith(item.id)) {
            delete triggeredActions.current[key];
          }
        });
      }}
    >
      <View style={styles.taskItem}>
        <TouchableOpacity
          style={styles.taskContentWrapper}
          onPress={() =>
            navigation.navigate('TaskDetail', {
              task: item,
              onToggleComplete: handleToggleComplete,
            })
          }
        >
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleToggleComplete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
              ]}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Text
                style={[
                  styles.taskTitle,
                  item.completed && styles.completedTask,
                ]}
              >
                {item.title}
              </Text>
              <View
                style={[
                  styles.priorityBadge,
                  item.priority === 'high' && styles.priorityHigh,
                  item.priority === 'medium' && styles.priorityMedium,
                  item.priority === 'low' && styles.priorityLow,
                ]}
              >
                <Text style={styles.priorityText}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            {item.description ? (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <View style={styles.taskFooter}>
              {item.dueDate ? (
                <Text style={styles.taskDate}>Due: {item.dueDate}</Text>
              ) : null}
              {item.category ? (
                <Text style={styles.taskCategory}>{item.category}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
          },
        ]}
      >
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <FlatList
          data={skeletonData}
          renderItem={renderSkeleton}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 0) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : tasks.length === 0 ? (
        <View
          style={[
            styles.emptyContainer,
            { paddingBottom: Math.max(insets.bottom, 0) + 80 },
          ]}
        >
          <Text style={styles.emptyText}>No tasks yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Add Task" to create your first task
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 0) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadTasks}
        />
      )}

      <AddTaskModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddTask={handleAddTask}
      />
    </View>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityHigh: {
    backgroundColor: '#ff5252',
  },
  priorityMedium: {
    backgroundColor: '#ff9800',
  },
  priorityLow: {
    backgroundColor: '#4caf50',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  taskCategory: {
    fontSize: 12,
    color: '#6200ee',
    fontWeight: '500',
  },
  completeAction: {
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
    marginLeft: 16,
    paddingRight: 20,
    marginRight: -10,
    marginBottom: 12,
  },
  completeActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  completeActionIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  completeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteAction: {
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: 100,
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    marginLeft: -10,
    marginBottom: 12,
    paddingLeft: 20,
  },
  deleteActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff9800',
    marginLeft: 12,
  },
  completedIndicator: {
    backgroundColor: '#4caf50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonTitle: {
    height: 20,
    width: 180,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 4,
  },
  skeletonPriority: {
    height: 20,
    width: 60,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginLeft: 8,
  },
  skeletonDescription: {
    height: 16,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  skeletonDate: {
    height: 14,
    width: 100,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonCategory: {
    height: 14,
    width: 80,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
});

export default HomeScreen;
