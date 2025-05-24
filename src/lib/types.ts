
export type UserRole = 'doctor' | 'patient';

export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserRole;
  created_at: string;
}

export interface Doctor extends User {
  user_type: 'doctor';
  specialization?: string;
  license_number: string;
}

export interface Patient extends User {
  user_type: 'patient';
  id_number: string; // National ID or similar
  date_of_birth?: string; // YYYY-MM-DD
  address?: string;
  phone_number?: string;
}

export interface DoctorPatientMap {
  doctor_id: number;
  patient_id: number;
}

export interface Diagnosis {
  diagnosis_id: number;
  patient_id: number;
  diagnosis_text: string;
  diagnosed_by: number; // doctor_id
  diagnosis_date: string; // YYYY-MM-DD
  created_at: string;
  doctor_name?: string; // For display purposes
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string; // ISO string
  reason?: string;
  notes?: string;
  created_at: string;
  patient_name?: string; // For display
  doctor_name?: string; // For display
}

export interface PatientDocument {
  document_id: number;
  patient_id: number;
  document_name: string;
  document_type?: string;
  document_path: string; // This would be a URL or path to storage
  uploaded_at: string;
  uploaded_by?: number; // user_id
}

export interface ChatMessage {
  chat_id: number;
  patient_id: number;
  sender_id: number; // user_id (could be patient or AI/doctor)
  sender_name?: string; // For display
  message_text: string;
  sent_at: string;
  is_user: boolean; // True if message is from the logged-in patient
}

export interface AiInstruction {
  instruction_id: number;
  doctor_id: number;
  instruction_text: string;
  prompt_text?: string;
  created_at: string;
  updated_at: string;
}

export interface PillReminder {
  id: string; // client-generated id
  medicationName: string;
  dosage: string;
  frequency: string; // e.g., "Once a day", "Twice a day"
  times: string[]; // e.g., ["08:00", "20:00"]
  notes?: string;
}

// Mock User for auth simulation
export interface MockUser extends User {
  // No password_hash here for client-side mock
}
