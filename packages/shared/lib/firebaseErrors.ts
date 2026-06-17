/**
 * Firebase Error Handler
 * Translates raw Firebase error codes into clear, user-friendly messages.
 */

const AUTH_ERROR_MAP: Record<string, string> = {
  // Login & Credential Errors
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/invalid-email': 'The email address is not valid. Please enter a correct email.',
  'auth/user-disabled': 'This account has been disabled by an administrator.',

  // Registration Errors
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
  'auth/operation-not-allowed': 'This sign-in method is currently disabled. Contact an administrator.',

  // Rate Limiting & Security
  'auth/too-many-requests': 'Too many failed attempts. Your account has been temporarily locked. Please try again later.',
  'auth/network-request-failed': 'Network connection failed. Please check your internet connection and try again.',

  // Token & Session Errors  
  'auth/invalid-action-code': 'The password reset link is invalid or has expired. Please request a new one.',
  'auth/expired-action-code': 'The password reset link has expired. Please request a new one.',
  'auth/requires-recent-login': 'This action requires you to log in again for security. Please sign out and sign back in.',

  // Misc
  'auth/popup-closed-by-user': 'The sign-in popup was closed before completing. Please try again.',
  'auth/unauthorized-domain': 'This domain is not authorized for sign-in operations.',
  'auth/internal-error': 'An internal authentication error occurred. Please try again.',
};

const FIRESTORE_ERROR_MAP: Record<string, string> = {
  'permission-denied': 'You do not have permission to perform this action. Check your account role and try again.',
  'not-found': 'The requested record could not be found. It may have been deleted.',
  'already-exists': 'A record with this identifier already exists.',
  'resource-exhausted': 'Too many requests. Please wait a moment and try again.',
  'failed-precondition': 'This operation cannot be performed in the current state. Please refresh and try again.',
  'aborted': 'The operation was interrupted. Please try again.',
  'unavailable': 'The service is temporarily unavailable. Please check your internet connection and try again.',
  'data-loss': 'Critical data error. Please contact an administrator immediately.',
  'unauthenticated': 'Your session has expired. Please log in again.',
  'deadline-exceeded': 'The request took too long. Please check your connection and try again.',
  'cancelled': 'The operation was cancelled.',
  'invalid-argument': 'Invalid data provided. Please check your input and try again.',
};

const STORAGE_ERROR_MAP: Record<string, string> = {
  'storage/unauthorized': 'You do not have permission to upload or access files.',
  'storage/canceled': 'The file upload was cancelled.',
  'storage/unknown': 'An unknown error occurred during file upload. Please try again.',
  'storage/object-not-found': 'The requested file does not exist.',
  'storage/quota-exceeded': 'Storage quota exceeded. Contact an administrator.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple retries. Please check your connection.',
  'storage/invalid-checksum': 'File upload integrity check failed. Please try uploading again.',
  'storage/server-file-wrong-size': 'File upload incomplete. Please try again.',
};

/**
 * Extracts a user-friendly error message from any Firebase error.
 * Falls back to a generic but helpful message if the code is unknown.
 */
export function getFirebaseErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code: string = error?.code || '';

  // Check auth errors
  if (AUTH_ERROR_MAP[code]) return AUTH_ERROR_MAP[code];

  // Check Firestore errors (codes may or may not have prefix)
  const firestoreCode = code.replace('firestore/', '');
  if (FIRESTORE_ERROR_MAP[firestoreCode]) return FIRESTORE_ERROR_MAP[firestoreCode];

  // Check Storage errors
  if (STORAGE_ERROR_MAP[code]) return STORAGE_ERROR_MAP[code];

  // Fallback: if Firebase provided a message, clean it up
  if (error?.message) {
    // Strip "Firebase: " prefix and error code suffix like " (auth/xxx)."
    const cleaned = error.message
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\([a-z\-\/]+\)\.\s*$/i, '')
      .trim();
    
    if (cleaned && cleaned.length > 5) return cleaned;
  }

  return 'An unexpected error occurred. Please try again.';
}
