import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CSATResponse } from '../types/csat';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/* CRITICAL: Must pass databaseId according to Skill specification */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Authenticate anonymously for secure authorized Firestore operations
signInAnonymously(auth).catch((err) => {
  console.info('Firebase auth initialization:', err?.message || err);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Local cache will be used.');
    }
    return false;
  }
}

// Initial connection test
testConnection();

const RESPONSES_COLLECTION = 'responses';

/**
 * Save new survey response in real-time to Firestore
 */
export async function submitCSATResponse(response: CSATResponse): Promise<void> {
  const path = `${RESPONSES_COLLECTION}/${response.id}`;
  try {
    // Strip undefined properties to comply with Firestore
    const cleanData: Record<string, unknown> = {
      id: response.id,
      createdAt: response.createdAt,
      desk: response.desk,
      serviceType: response.serviceType,
      averageRating: response.averageRating,
      ratings: {
        q1_keramahan: Number(response.ratings.q1_keramahan),
        q2_kejelasan: Number(response.ratings.q2_kejelasan),
        q3_kecepatan: Number(response.ratings.q3_kecepatan),
        q4_profesionalisme: Number(response.ratings.q4_profesionalisme),
        q5_kepuasan_umum: Number(response.ratings.q5_kepuasan_umum),
      },
    };

    if (response.officerName && response.officerName.trim()) {
      cleanData.officerName = response.officerName.trim();
    }
    if (response.customerName && response.customerName.trim()) {
      cleanData.customerName = response.customerName.trim();
    }
    if (response.customerPhone && response.customerPhone.trim()) {
      cleanData.customerPhone = response.customerPhone.trim();
    }
    if (response.feedback && response.feedback.trim()) {
      cleanData.feedback = response.feedback.trim();
    }

    await setDoc(doc(db, RESPONSES_COLLECTION, response.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Real-time subscription to survey responses
 */
export function subscribeToCSATResponses(
  onUpdate: (responses: CSATResponse[]) => void,
  onError?: (err: Error) => void
): () => void {
  const responsesQuery = query(
    collection(db, RESPONSES_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  let fallbackUnsubscribe: (() => void) | null = null;

  const unsubscribe = onSnapshot(
    responsesQuery,
    (snapshot) => {
      const items: CSATResponse[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CSATResponse;
        if (data && data.ratings) {
          items.push({
            id: data.id || docSnap.id,
            createdAt: data.createdAt,
            desk: data.desk,
            officerName: data.officerName,
            serviceType: data.serviceType,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            ratings: data.ratings,
            averageRating: Number(data.averageRating),
            feedback: data.feedback,
          });
        }
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Real-time query with orderBy error, listening to base collection:', error);
      // Fallback query if orderBy index or permissions require base collection listener
      fallbackUnsubscribe = onSnapshot(
        collection(db, RESPONSES_COLLECTION),
        (snapshot) => {
          const items: CSATResponse[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CSATResponse;
            if (data && data.ratings) {
              items.push({
                id: data.id || docSnap.id,
                createdAt: data.createdAt,
                desk: data.desk,
                officerName: data.officerName,
                serviceType: data.serviceType,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                ratings: data.ratings,
                averageRating: Number(data.averageRating),
                feedback: data.feedback,
              });
            }
          });
          // Sort client-side by date descending
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          onUpdate(items);
        },
        (fallbackErr) => {
          console.error('Error on base snapshot:', fallbackErr);
          if (onError) onError(fallbackErr);
          handleFirestoreError(fallbackErr, OperationType.GET, RESPONSES_COLLECTION);
        }
      );
    }
  );

  return () => {
    unsubscribe();
    if (fallbackUnsubscribe) {
      fallbackUnsubscribe();
    }
  };
}

/**
 * Clears all survey responses from Firestore (for fresh start)
 */
export async function clearAllResponsesFromFirestore(): Promise<void> {
  const path = RESPONSES_COLLECTION;
  try {
    const snap = await getDocs(collection(db, RESPONSES_COLLECTION));
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

