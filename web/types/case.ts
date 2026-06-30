// Domain types mirroring the Go API (CLAUDE.md §5 / §7).

export type Role = 'dentist' | 'lab';

export interface User {
  id: string;
  email: string;
  role: Role;
  full_name: string;
  clinic_name: string;
  phone?: string | null;
  city?: string | null;
  created_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResult {
  user: User;
  tokens: Tokens;
}

export interface Lab {
  id: string;
  clinic_name: string;
  city?: string | null;
}

export type CaseStatus =
  | 'new'
  | 'accepted'
  | 'designing'
  | 'fabricating'
  | 'checking'
  | 'ready'
  | 'delivered'
  | 'rejected'
  | 'correction';

export type Priority = 'normal' | 'urgent';

export interface Case {
  id: string;
  dentist_id: string;
  lab_id: string;
  patient_ref: string;
  teeth: string[];
  prosthesis_type: string;
  material: string;
  shade?: string | null;
  status: CaseStatus;
  priority: Priority;
  due_date: string;
  notes?: string | null;
  extra_fields?: Record<string, unknown> | null;
  reception_checklist?: ReceptionChecklist | null;
  received_at?: string | null;
  delivery_signature?: string | null;
  signed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceptionChecklist {
  empreinte?: boolean;
  prescription?: boolean;
  photos?: boolean;
  teinte?: boolean;
  antagoniste?: boolean;
  occlusion?: boolean;
}

export type ReturnReason =
  | 'teinte'
  | 'forme'
  | 'occlusion'
  | 'marge'
  | 'contact'
  | 'axe'
  | 'surface'
  | 'autre';

export interface CaseReturn {
  id: string;
  case_id: string;
  returned_by: string;
  returned_by_name?: string;
  reasons: ReturnReason[];
  note?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  case_id?: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CreateCaseInput {
  lab_id: string;
  patient_ref: string;
  teeth: string[];
  prosthesis_type: string;
  material: string;
  shade?: string;
  priority?: Priority;
  due_date: string; // YYYY-MM-DD
  notes?: string;
  extra_fields?: Record<string, unknown>;
}

export interface StatusEvent {
  id: string;
  case_id: string;
  from_status?: string | null;
  to_status: CaseStatus;
  changed_by: string;
  changed_by_name?: string;
  note?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface CaseFile {
  id: string;
  case_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}
