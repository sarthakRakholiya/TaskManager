import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createTask, updateTask } from '../services/taskService';
import Toast from 'react-native-toast-message';
import FormInput from './FormInput';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
}

interface AddTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  task?: Task;
  onUpdateTask?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

const taskSchema = yup.object().shape({
  title: yup
    .string()
    .required('Task name is required')
    .min(3, 'Task name must be at least 3 characters')
    .max(100, 'Task name cannot exceed 100 characters'),
  description: yup
    .string()
    .default('')
    .max(500, 'Description cannot exceed 500 characters'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Invalid priority')
    .required('Priority is required') as yup.StringSchema<
    'low' | 'medium' | 'high'
  >,
  category: yup
    .string()
    .default('')
    .max(50, 'Category cannot exceed 50 characters'),
});

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isVisible,
  onClose,
  onAddTask,
  task,
  onUpdateTask,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!task;
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isVisible && task) {
      reset({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
      });
    } else if (!isVisible) {
      reset();
      setIsSubmitting(false);
    }
  }, [isVisible, task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true);

      const taskData = {
        title: data.title.trim(),
        description: data.description.trim(),
        dueDate: task?.dueDate || '',
        priority: data.priority,
        category: data.category.trim(),
      };

      if (isEditMode && task) {
        const result = await updateTask(task.id, taskData);

        if (result.success) {
          Toast.show({
            type: 'success',
            text1: 'Success!',
            text2: 'Task updated successfully',
          });

          if (onUpdateTask) {
            onUpdateTask();
          }
          reset();
          onClose();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error!',
            text2: result.error || 'Failed to update task',
          });
        }
      } else {
        const result = await createTask(taskData);

        if (result.success) {
          Toast.show({
            type: 'success',
            text1: 'Success!',
            text2: 'Task created successfully',
          });

          onAddTask(taskData);
          reset();
          onClose();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error!',
            text2: result.error || 'Failed to create task',
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error!',
        text2:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.modalContent}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            {isEditMode ? 'Edit Task' : 'Add New Task'}
          </Text>

          <View style={styles.form}>
            <FormInput
              control={control}
              name="title"
              label="Task Name"
              placeholder="Enter task name"
              required
              error={errors.title?.message}
            />

            <FormInput
              control={control}
              name="description"
              label="Description"
              placeholder="Enter task description"
              multiline
              numberOfLines={4}
              error={errors.description?.message}
            />

            <View>
              <Text style={styles.label}>Priority</Text>
              <Controller
                control={control}
                name="priority"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.priorityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        value === 'low' && styles.priorityButtonActive,
                      ]}
                      onPress={() => onChange('low')}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          value === 'low' && styles.priorityButtonTextActive,
                        ]}
                      >
                        Low
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        value === 'medium' && styles.priorityButtonActive,
                      ]}
                      onPress={() => onChange('medium')}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          value === 'medium' && styles.priorityButtonTextActive,
                        ]}
                      >
                        Medium
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        value === 'high' && styles.priorityButtonActive,
                      ]}
                      onPress={() => onChange('high')}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          value === 'high' && styles.priorityButtonTextActive,
                        ]}
                      >
                        High
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <FormInput
              control={control}
              name="category"
              label="Category"
              placeholder="e.g., Work, Personal, Shopping"
              error={errors.category?.message}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                (!isValid || !watch('title')?.trim() || isSubmitting) &&
                  styles.addButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || !watch('title')?.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>
                  {isEditMode ? 'Update Task' : 'Add Task'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  priorityButtonActive: {
    borderColor: '#6200ee',
    backgroundColor: '#6200ee',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddTaskModal;
