
export type UserRole = 'doctor' | 'patient';

export interface User {
  uid: string; // Firebase Auth UID
  email: string | null;
  firstName: string;
  lastName: string;
  userType: UserRole;
  createdAt: string; // ISO string
  // username is often derived or same as email's prefix, or not used if email is primary identifier
}

// This MockUser might be deprecated or refactored if User directly represents Firebase user.
// For now, let's assume User is the primary type.
export type MockUser = User;


export interface Doctor extends User {
  userType: 'doctor';
  specialization?: string;
  licenseNumber?: string; // Made optional for simpler profile creation initially
}

export interface Patient extends User {
  userType: 'patient';
  idNumber?: string; // National ID or similar, made optional
  dateOfBirth?: string; // YYYY-MM-DD
  address?: string;
  phoneNumber?: string;
  dedicatedPrompts?: string; // Dedicated AI prompts for this patient
}

// Data record for a patient, managed by doctors, separate from their auth profile initially.
export interface PatientRecord {
  recordId: string; // Firestore document ID
  doctorId: string; // UID of the doctor who created/manages this record
  firstName: string;
  lastName: string;
  email?: string; // Patient's email, can be used for linking later
  idNumber: string; // Patient ID (e.g., P001)
  dateOfBirth?: string;
  address?: string;
  phoneNumber?: string;
  patientSpecificPrompts?: string;
  createdAt: string; // ISO string
  linkedAuthUid?: string; // UID of the patient's Firebase Auth account if linked
}


export interface DoctorPatientMap {
  doctorId: string; // Firebase UID
  patientId: string; // Firebase UID
}

export interface Diagnosis {
  diagnosisId: string; // Firestore document ID
  patientId: string; // Firebase UID of the patient or PatientRecord ID
  diagnosisText: string;
  diagnosedBy: string; // Firebase UID of the doctor
  diagnosisDate: string; // YYYY-MM-DD
  createdAt: string;
  doctorName?: string; // For display purposes
}

export interface Appointment {
  appointmentId: string; // Firestore document ID
  patientId: string; // Firebase UID of the patient
  doctorId: string; // Firebase UID of the doctor
  appointmentDate: string; // ISO string
  reason?: string;
  notes?: string;
  createdAt: string;
  patientName?: string; // For display
  doctorName?: string; // For display
}

export interface PatientDocument {
  documentId: string; // Firestore document ID
  patientId: string; // Firebase UID of the patient or PatientRecord ID
  documentName: string;
  documentType?: string;
  documentPath: string; // This would be a URL or path to Firebase Storage
  uploadedAt: string;
  uploadedBy?: string; // Firebase UID of the uploader
}

export interface ChatMessage {
  chatId: string; // Firestore document ID
  patientId: string; // Firebase UID of the patient
  senderId: string; // Firebase UID (patient or "AI" placeholder)
  senderName?: string; // For display
  messageText: string;
  sentAt: string; // ISO string
  isUser: boolean; // True if message is from the logged-in patient
}

export interface AiInstruction {
  instructionId: string; // Firestore document ID
  doctorId: string; // Firebase UID of the doctor
  instructionText: string;
  promptText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PillReminder {
  id: string; // client-generated id or Firestore document ID
  patientUid: string; // Firebase UID of the patient
  medicationName: string;
  dosage: string;
  frequency: string; // e.g., "Once a day", "Twice a day"
  times: string[]; // e.g., ["08:00", "20:00"]
  notes?: string;
}
