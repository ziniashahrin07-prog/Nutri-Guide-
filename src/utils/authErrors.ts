export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase project console. Please enable Email/Password provider under Firebase Console → Authentication → Sign-in method, or use Google Sign-In.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup request was cancelled.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};
