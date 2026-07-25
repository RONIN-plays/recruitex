import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface UserActivity {
  uid: string;
  email: string;
  displayName?: string;
  userType: 'candidate' | 'recruiter';
  status: 'active' | 'inactive';
  loginTime: Timestamp | null;
  lastActivity: Timestamp | null;
  currentPage?: string;
  deviceInfo?: string;
  biometricId?: string;
}

export const trackUserLogin = async (
  uid: string,
  email: string,
  displayName: string | undefined,
  userType: 'candidate' | 'recruiter',
  biometricId?: string
) => {
  try {
    const userActivityRef = doc(collection(db, 'userActivity'), uid);
    
    await setDoc(userActivityRef, {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      userType,
      status: 'active',
      loginTime: serverTimestamp(),
      lastActivity: serverTimestamp(),
      biometricId: biometricId || null,
      deviceInfo: navigator.userAgent,
    }, { merge: true });

    // Set up activity tracking
    setupActivityTracking(uid);
  } catch (error) {
    console.error('Error tracking user login:', error);
  }
};

export const setupActivityTracking = (uid: string) => {
  // Track user activity every 30 seconds
  const activityInterval = setInterval(async () => {
    try {
      const userActivityRef = doc(db, 'userActivity', uid);
      await updateDoc(userActivityRef, {
        lastActivity: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user activity:', error);
      clearInterval(activityInterval);
    }
  }, 30000); // Update every 30 seconds

  // Clean up on window beforeunload
  window.addEventListener('beforeunload', () => {
    clearInterval(activityInterval);
  });

  return activityInterval;
};

export const trackUserLogout = async (uid: string) => {
  try {
    const userActivityRef = doc(db, 'userActivity', uid);
    await updateDoc(userActivityRef, {
      status: 'inactive',
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking user logout:', error);
  }
};

export const trackPageChange = async (uid: string, currentPage: string) => {
  try {
    const userActivityRef = doc(db, 'userActivity', uid);
    await updateDoc(userActivityRef, {
      currentPage,
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking page change:', error);
  }
};
