import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile
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
import { Transaction, Currency, Budget, Goal, Bill, PortfolioAsset, Debt, User } from '../types';

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

export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(user, { displayName });
        }
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
        const { email, displayName } = user;
        const createdAt = new Date();
        const defaultPreferences: UserPreferences = {
            isDarkMode: false,
            currency: Currency.USD
        };

        try {
            await setDoc(userDocRef, {
                email,
                displayName,
                createdAt,
                initialCashBalance: 0,
                initialOnlineBalance: 0
            });
            // Also create initial preferences
            await saveUserPreferences(user.uid, defaultPreferences);
        } catch (error) {
            console.error("Error creating user document:", error);
            throw error;
        }
    }
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data as any);
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

export const addTransactionForUser = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const transactionsColRef = collection(db, 'users', userId, 'transactions');
    const docRef = await addDoc(transactionsColRef, transaction);
    return { id: docRef.id, ...transaction } as Transaction;
};

export const updateTransactionForUser = async (userId: string, id: string, transaction: Partial<Transaction>): Promise<void> => {
    const transactionDocRef = doc(db, 'users', userId, 'transactions', id);
    await updateDoc(transactionDocRef, transaction);
};

export const deleteTransactionForUser = async (userId: string, transactionId: string): Promise<void> => {
    const transactionDocRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(transactionDocRef);
};

// Budgets
export const getBudgetsForUser = async (userId: string): Promise<Budget[]> => {
    const colRef = collection(db, 'users', userId, 'budgets');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
};

export const addBudgetForUser = async (userId: string, budget: Omit<Budget, 'id'>): Promise<Budget> => {
    const colRef = collection(db, 'users', userId, 'budgets');
    const docRef = await addDoc(colRef, budget);
    return { id: docRef.id, ...budget } as Budget;
};

export const updateBudgetForUser = async (userId: string, id: string, budget: Partial<Budget>): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'budgets', id);
    await updateDoc(docRef, budget);
};

export const deleteBudgetForUser = async (userId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'budgets', id);
    await deleteDoc(docRef);
};

// Goals
export const getGoalsForUser = async (userId: string): Promise<Goal[]> => {
    const colRef = collection(db, 'users', userId, 'goals');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

export const addGoalForUser = async (userId: string, goal: Omit<Goal, 'id'>): Promise<Goal> => {
    const colRef = collection(db, 'users', userId, 'goals');
    const docRef = await addDoc(colRef, goal);
    return { id: docRef.id, ...goal } as Goal;
};

export const updateGoalForUser = async (userId: string, id: string, goal: Partial<Goal>): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'goals', id);
    await updateDoc(docRef, goal);
};

export const deleteGoalForUser = async (userId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'goals', id);
    await deleteDoc(docRef);
};

// Bills
export const getBillsForUser = async (userId: string): Promise<Bill[]> => {
    const colRef = collection(db, 'users', userId, 'bills');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
};

export const addBillForUser = async (userId: string, bill: Omit<Bill, 'id'>): Promise<Bill> => {
    const colRef = collection(db, 'users', userId, 'bills');
    const docRef = await addDoc(colRef, bill);
    return { id: docRef.id, ...bill } as Bill;
};

export const updateBillForUser = async (userId: string, id: string, bill: Partial<Bill>): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'bills', id);
    await updateDoc(docRef, bill);
};

export const deleteBillForUser = async (userId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'bills', id);
    await deleteDoc(docRef);
};

// Portfolio
export const getPortfolioForUser = async (userId: string): Promise<PortfolioAsset[]> => {
    const colRef = collection(db, 'users', userId, 'portfolio');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioAsset));
};

export const addPortfolioAssetForUser = async (userId: string, asset: Omit<PortfolioAsset, 'id'>): Promise<PortfolioAsset> => {
    const colRef = collection(db, 'users', userId, 'portfolio');
    const docRef = await addDoc(colRef, asset);
    return { id: docRef.id, ...asset } as PortfolioAsset;
};

export const updatePortfolioAssetForUser = async (userId: string, id: string, asset: Partial<PortfolioAsset>): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'portfolio', id);
    await updateDoc(docRef, asset);
};

export const deletePortfolioAssetForUser = async (userId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'portfolio', id);
    await deleteDoc(docRef);
};

// Debts
export const getDebtsForUser = async (userId: string): Promise<Debt[]> => {
    const colRef = collection(db, 'users', userId, 'debts');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
};

export const addDebtForUser = async (userId: string, debt: Omit<Debt, 'id'>): Promise<Debt> => {
    const colRef = collection(db, 'users', userId, 'debts');
    const docRef = await addDoc(colRef, debt);
    return { id: docRef.id, ...debt } as Debt;
};

export const updateDebtForUser = async (userId: string, id: string, debt: Partial<Debt>): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'debts', id);
    await updateDoc(docRef, debt);
};

export const deleteDebtForUser = async (userId: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'debts', id);
    await deleteDoc(docRef);
};
