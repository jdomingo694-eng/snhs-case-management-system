rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cases collection
    match /cases/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email.matches('.*@deped.gov.ph$|.*@subicnhs.edu.ph$');
      allow update: if request.auth != null && request.auth.token.email.matches('.*@deped.gov.ph$|.*@subicnhs.edu.ph$');
      allow delete: if request.auth != null && request.auth.token.role == 'superadmin';
    }
    
    // Documents collection (prohibited documents)
    match /documents/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email.matches('.*@deped.gov.ph$|.*@subicnhs.edu.ph$');
      allow update: if request.auth != null && request.auth.token.email.matches('.*@deped.gov.ph$|.*@subicnhs.edu.ph$');
      allow delete: if request.auth != null && request.auth.token.role == 'superadmin';
    }
    
    // Users collection
    match /users/{document} {
      allow read: if request.auth != null && request.auth.token.role in ['superadmin', 'admin'];
      allow create: if request.auth != null && request.auth.token.role == 'superadmin';
      allow update: if request.auth != null && request.auth.token.role in ['superadmin', 'admin'];
      allow delete: if request.auth != null && request.auth.token.role == 'superadmin';
    }
  }
}