import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Transaction, Currency, User } from '../types';

interface UserPreferences {
    isDarkMode: boolean;
    currency: Currency;
}

// --- Auth Listener ---

export const onAuthStateChangedListener = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// --- Auth Actions ---

const formatAuthError = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        default:
            return 'An unknown authentication error occurred. Please try again.';
    }
}

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocumentFromAuth(user);
        return user;
    } catch (error: any) {
        throw new Error(formatAuthError(error.code));
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        return user;
    } catch (error: any) {
        throw new Error(formatAuthError(error.code));
    }
};

export const signOutUser = async (): Promise<void> => {
    await signOut(auth);
};


// --- Firestore User Profile ---

export const createUserDocumentFromAuth = async (user: FirebaseUser) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
        const { email } = user;
        const createdAt = new Date();
        const defaultPreferences: UserPreferences = {
            isDarkMode: false,
            currency: Currency.USD
        };

        try {
            await setDoc(userDocRef, {
                email,
                createdAt
            });
            // Also create initial preferences
            await saveUserPreferences(user.uid, defaultPreferences);
        } catch (error) {
            console.error("Error creating user document:", error);
            throw error;
        }
    }
};

// --- Firestore Data Operations ---

// Preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
    const prefDocRef = doc(db, 'users', userId, 'preferences', 'user_prefs');
    const docSnap = await getDoc(prefDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserPreferences;
    }
    // Return default if not found
    return { isDarkMode: false, currency: Currency.USD };
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
    const prefDocRef = doc(db, 'users', userId, 'preferences', 'user_prefs');
    await setDoc(prefDocRef, preferences, { merge: true });
};


// Transactions
export const getTransactionsForUser = async (userId: string): Promise<Transaction[]> => {
    const transactionsColRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsColRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Transaction));
};

export const addTransactionForUser = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<void> => {
    const transactionsColRef = collection(db, 'users', userId, 'transactions');
    await addDoc(transactionsColRef, transaction);
};

export const updateTransactionForUser = async (userId: string, transaction: Transaction): Promise<void> => {
    if (!transaction.id) {
        throw new Error("Transaction ID is required for updates.");
    }
    const transactionDocRef = doc(db, 'users', userId, 'transactions', transaction.id);
    const { id, ...transactionData } = transaction;
    await updateDoc(transactionDocRef, transactionData);
};

export const deleteTransactionForUser = async (userId: string, transactionId: string): Promise<void> => {
    const transactionDocRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(transactionDocRef);
};