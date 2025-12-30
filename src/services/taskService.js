import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  showTaskCreatedNotification,
  showTaskCompletedNotification,
} from './notificationService';

getApp();

const authInstance = auth();
const firestoreInstance = firestore();

export const createTask = async taskData => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const taskRef = firestoreInstance.collection('tasks').doc();
    const newTask = {
      ...taskData,
      id: taskRef.id,
      userId: user.uid,
      completed: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await taskRef.set(newTask);

    try {
      await showTaskCreatedNotification(taskData.title || 'New Task');
    } catch (notificationError) {
    }

    return { success: true, taskId: taskRef.id, task: newTask };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserTasks = async () => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const tasksSnapshot = await firestoreInstance
      .collection('tasks')
      .where('userId', '==', user.uid)
      .get();

    const tasks = [];
    tasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      tasks.push({
        id: doc.id,
        ...taskData,
      });
    });

    tasks.sort((a, b) => {
      const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
      const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return { success: true, tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const taskRef = firestoreInstance.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return { success: false, error: 'Task not found' };
    }

    const taskData = taskDoc.data();
    if (taskData.userId !== user.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    await taskRef.update({
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const toggleTaskComplete = async taskId => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const taskRef = firestoreInstance.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return { success: false, error: 'Task not found' };
    }

    const taskData = taskDoc.data();
    if (taskData.userId !== user.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const newCompletedStatus = !taskData.completed;
    await taskRef.update({
      completed: newCompletedStatus,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    try {
      await showTaskCompletedNotification(
        taskData.title || 'Task',
        newCompletedStatus,
      );
    } catch (notificationError) {
    }

    return { success: true, completed: newCompletedStatus };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteTask = async taskId => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const taskRef = firestoreInstance.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return { success: false, error: 'Task not found' };
    }

    const taskData = taskDoc.data();
    if (taskData.userId !== user.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    await taskRef.delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTask = async taskId => {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const taskDoc = await firestoreInstance
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return { success: false, error: 'Task not found' };
    }

    const taskData = taskDoc.data();
    if (taskData.userId !== user.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, task: { id: taskDoc.id, ...taskData } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
