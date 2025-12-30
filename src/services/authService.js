import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

getApp();

const authInstance = auth();
const firestoreInstance = firestore();

export const signUp = async (email, password, name) => {
  try {
    const userCredential = await authInstance.createUserWithEmailAndPassword(
      email,
      password,
    );

    const user = userCredential.user;
    await user.updateProfile({
      displayName: name,
    });

    try {
      await firestoreInstance.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (firestoreError) {
    }
    return { success: true, user: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await authInstance.signInWithEmailAndPassword(
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await authInstance.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return authInstance.currentUser;
};

export const getUserData = async userId => {
  try {
    const userDoc = await firestoreInstance
      .collection('users')
      .doc(userId)
      .get();
    if (userDoc.exists) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: 'User data not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
