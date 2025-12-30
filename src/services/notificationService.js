import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        return true;
      }
      return false;
    } else {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus >= 1) {
        return true;
      }
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      await notifee.createChannel({
        id: 'task_notifications',
        name: 'Task Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    } catch (error) {
    }
  }
};

export const showTaskCreatedNotification = async (taskTitle) => {
  try {
    await createNotificationChannel();

    await notifee.displayNotification({
      title: 'Task Created! ✅',
      body: `"${taskTitle}" has been added to your tasks`,
      android: {
        channelId: 'task_notifications',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        vibrationPattern: [300, 500],
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  } catch (error) {
  }
};

export const showTaskCompletedNotification = async (taskTitle, isCompleted) => {
  try {
    await createNotificationChannel();

    await notifee.displayNotification({
      title: isCompleted ? 'Task Completed! 🎉' : 'Task Reopened',
      body: isCompleted
        ? `Great job! "${taskTitle}" is now completed`
        : `"${taskTitle}" has been reopened`,
      android: {
        channelId: 'task_notifications',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        vibrationPattern: [300, 500],
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  } catch (error) {
  }
};

export const initializeNotifications = async () => {
  try {
    await createNotificationChannel();

    const hasPermission = await requestNotificationPermission();

    if (Platform.OS === 'ios') {
      messaging().onMessage(async remoteMessage => {
        if (remoteMessage.notification) {
          await notifee.displayNotification({
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            ios: {
              foregroundPresentationOptions: {
                alert: true,
                badge: true,
                sound: true,
              },
            },
          });
        }
      });
    }

    messaging().setBackgroundMessageHandler(async remoteMessage => {
    });

    return hasPermission;
  } catch (error) {
    return false;
  }
};

