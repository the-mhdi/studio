
export type UserRole = 'doctor' | 'patient';

export interface User {
  uid: string; // Firebase Auth UID
  email: string | null;
  firstName: string;
  lastName: string;
  userType: UserRole;
  createdAt: any; // Firestore serverTimestamp or ISO string
}

export interface Doctor extends User {
  userType: 'doctor';
  specialization?: string;
  licenseNumber?: string;
}

export interface Patient extends User {
  userType: 'patient';
  // These fields might be part of PatientRecord instead if doctors manage them primarily
  // idNumber?: string; 
  // dateOfBirth?: string;
  // address?: string;
  // phoneNumber?: string;
}

// Data record for a patient, managed by doctors.
export interface PatientRecord {
  recordId?: string; // Firestore document ID (often not stored in the doc itself)
  doctorId: string; // UID of the doctor who created/manages this record
  firstName: string;
  lastName: string;
  idNumber: string; // Patient ID (e.g., P001) - created by the doctor
  initialPassword?: string; // Initial/Temporary password set by the doctor for this record
  email?: string; // Patient's email, can be used for linking later
  dateOfBirth?: string; // YYYY-MM-DD
  address?: string;
  phoneNumber?: string;
  patientSpecificPrompts?: string;
  createdAt: any; Firestore serverTimestamp
  linkedAuthUid?: string; // UID of the patient's Firebase Auth account if linked to this record
}


export interface DoctorPatientMap {
  doctorId: string; // Firebase UID
  patientId: string; // Firebase UID
}

export interface Diagnosis {
  diagnosisId: string; // Firestore document ID
  patientRecordId: string; // ID of the PatientRecord this diagnosis belongs to
  diagnosisText: string;
  diagnosedBy: string; // Firebase UID of the doctor
  diagnosisDate: string; // YYYY-MM-DD
  createdAt: any; // Firestore serverTimestamp
  doctorName?: string; // For display purposes
}

export interface Appointment {
  appointmentId: string; // Firestore document ID
  patientAuthUid: string; // Firebase UID of the patient (from User collection)
  patientRecordId?: string; // Optional: Link to the doctor-managed PatientRecord
  doctorId: string; // Firebase UID of the doctor
  appointmentDate: string; // ISO string
  reason?: string;
  notes?: string;
  createdAt: any; // Firestore serverTimestamp
  patientName?: string; // For display
  doctorName?: string; // For display
}

export interface PatientDocument {
  documentId: string; // Firestore document ID
  patientRecordId: string; // ID of the PatientRecord this document belongs to
  documentName: string;
  documentType?: string;
  documentPath: string; // This would be a URL or path to Firebase Storage
  uploadedAt: any; // Firestore serverTimestamp
  uploadedBy?: string; // Firebase UID of the uploader (doctor)
}

export interface ChatMessage {
  chatId: string; // Firestore document ID
  patientAuthUid: string; // Firebase UID of the patient (from User collection)
  senderId: string; // Firebase UID (patient or "AI" placeholder)
  senderName?: string; // For display
  messageText: string;
  sentAt: any; // Firestore serverTimestamp
  isUser: boolean; // True if message is from the logged-in patient
}

export interface AiInstruction {
  instructionId?: string; // Firestore document ID
  doctorId: string; // Firebase UID of the doctor
  instructionText: string;
  promptText?: string;
  createdAt: any; // Firestore serverTimestamp
  updatedAt: any; // Firestore serverTimestamp
}

export interface PillReminder {
  id: string; // client-generated id or Firestore document ID
  patientAuthUid: string; // Firebase UID of the patient
  medicationName: string;
  dosage: string;
  frequency: string; // e.g., "Once a day", "Twice a day"
  times: string[]; // e.g., ["08:00", "20:00"]
  notes?: string;
  createdAt: any; // Firestore serverTimestamp
}

