
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/authStore';
import type { Patient, Diagnosis, PatientDocument } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { User, Stethoscope, FileText, UploadCloud, PlusCircle, Edit, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Mock Data (replace with API calls)
const MOCK_PATIENTS_DB: Patient[] = [
  { user_id: 1, username: 'alice_p', email: 'alice.p@example.com', first_name: 'Alice', last_name: 'Smith', user_type: 'patient', created_at: '2023-01-15T10:00:00Z', id_number: 'P001', date_of_birth: '1990-05-20', address: '123 Health St, Wellness City', phone_number: '555-0101' },
  { user_id: 2, username: 'bob_k', email: 'bob.k@example.com', first_name: 'Bob', last_name: 'Johnson', user_type: 'patient', created_at: '2023-02-20T11:30:00Z', id_number: 'P002', date_of_birth: '1985-11-12', address: '456 Care Ave, Remedy Town', phone_number: '555-0102' },
];

const MOCK_DIAGNOSES_DB: Diagnosis[] = [
  { diagnosis_id: 101, patient_id: 1, diagnosis_text: 'Common Cold', diagnosed_by: 1, diagnosis_date: '2023-10-05', created_at: '2023-10-05T10:00:00Z', doctor_name: 'Dr. Emily White' },
  { diagnosis_id: 102, patient_id: 1, diagnosis_text: 'Mild Seasonal Allergies', diagnosed_by: 1, diagnosis_date: '2024-03-15', created_at: '2024-03-15T11:00:00Z', doctor_name: 'Dr. Emily White' },
  { diagnosis_id: 201, patient_id: 2, diagnosis_text: 'Sprained Ankle', diagnosed_by: 1, diagnosis_date: '2024-01-20', created_at: '2024-01-20T14:00:00Z', doctor_name: 'Dr. Emily White' },
];

const MOCK_DOCUMENTS_DB: PatientDocument[] = [
  { document_id: 301, patient_id: 1, document_name: 'Blood Test Results - Oct 2023.pdf', document_type: 'Lab Result', document_path: '/path/to/doc1.pdf', uploaded_at: '2023-10-06T09:00:00Z', uploaded_by: 1 },
  { document_id: 302, patient_id: 1, document_name: 'X-Ray Report - Ankle.pdf', document_type: 'Imaging Report', document_path: '/path/to/doc2.pdf', uploaded_at: '2024-01-21T10:00:00Z', uploaded_by: 1 },
];


export default function PatientProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.patientId ? parseInt(params.patientId as string) : null;
  
  const { user: doctorUser } = useAuthStore();
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editablePatientDetails, setEditablePatientDetails] = useState<Partial<Patient>>({});

  // Form states for new diagnosis/document
  const [newDiagnosisText, setNewDiagnosisText] = useState('');
  const [newDiagnosisDate, setNewDiagnosisDate] = useState<Date | undefined>(new Date());
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingDiagnosis, setIsAddingDiagnosis] = useState(false);

  const activeTab = searchParams.get('tab') || 'details';

  useEffect(() => {
    if (patientId) {
      // MOCK: Fetch patient data
      const foundPatient = MOCK_PATIENTS_DB.find(p => p.user_id === patientId);
      setPatient(foundPatient || null);
      setEditablePatientDetails(foundPatient || {});
      setDiagnoses(MOCK_DIAGNOSES_DB.filter(d => d.patient_id === patientId));
      setDocuments(MOCK_DOCUMENTS_DB.filter(doc => doc.patient_id === patientId));
    }
  }, [patientId]);

  const handleEditDetailsToggle = () => {
    if (isEditingDetails && patient) { // Save logic
        // MOCK: API call to save patient details
        console.log("Saving patient details (mock): ", editablePatientDetails);
        setPatient(prev => ({...prev, ...editablePatientDetails} as Patient));
        toast({ title: "Details Updated", description: `${patient.first_name}'s details saved.`});
    } else if (patient) {
        setEditablePatientDetails(patient); // Reset to current patient data on entering edit mode
    }
    setIsEditingDetails(!isEditingDetails);
  };
  
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditablePatientDetails(prev => ({...prev, [name]: value}));
  };


  const handleAddDiagnosis = (e: FormEvent) => {
    e.preventDefault();
    if (!patient || !doctorUser || !newDiagnosisDate) return;
    setIsAddingDiagnosis(true);
    const newDiagnosis: Diagnosis = {
      diagnosis_id: Date.now(), // Mock ID
      patient_id: patient.user_id,
      diagnosis_text: newDiagnosisText,
      diagnosed_by: doctorUser.user_id,
      doctor_name: `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`,
      diagnosis_date: format(newDiagnosisDate, 'yyyy-MM-dd'),
      created_at: new Date().toISOString(),
    };
    // MOCK: API call
    setTimeout(() => {
      setDiagnoses(prev => [newDiagnosis, ...prev]);
      setNewDiagnosisText('');
      setNewDiagnosisDate(new Date());
      toast({ title: 'Diagnosis Added', description: `New diagnosis recorded for ${patient.first_name}.` });
      setIsAddingDiagnosis(false);
    }, 500);
  };

  const handleDocumentUpload = (e: FormEvent) => {
    e.preventDefault();
    if (!patient || !documentFile || !doctorUser) return;
    setIsUploading(true);
    const newDocument: PatientDocument = {
      document_id: Date.now(), // Mock ID
      patient_id: patient.user_id,
      document_name: documentName || documentFile.name,
      document_type: documentType,
      document_path: `/uploads/mock/${documentFile.name}`, // Mock path
      uploaded_at: new Date().toISOString(),
      uploaded_by: doctorUser.user_id,
    };
    // MOCK: API call for upload
     setTimeout(() => {
      setDocuments(prev => [newDocument, ...prev]);
      setDocumentFile(null);
      setDocumentName('');
      setDocumentType('');
      toast({ title: 'Document Uploaded', description: `${newDocument.document_name} added.` });
      setIsUploading(false);
    }, 1000);
  };
  
  const handleDeleteDiagnosis = (diagnosisId: number) => {
    // MOCK: API call
    setDiagnoses(prev => prev.filter(d => d.diagnosis_id !== diagnosisId));
    toast({ title: "Diagnosis Deleted", variant: "destructive"});
  }

  const handleDeleteDocument = (documentId: number) => {
     // MOCK: API call
    setDocuments(prev => prev.filter(d => d.document_id !== documentId));
    toast({ title: "Document Deleted", variant: "destructive"});
  }


  if (!patient) {
    return <div className="text-center py-10">Loading patient data or patient not found...</div>;
  }

  return (
    <div>
      <DashboardHeader
        title={`${patient.first_name} ${patient.last_name}`}
        description={`Patient ID: ${patient.id_number} | DOB: ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}`}
      />

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="details"><User className="mr-2 h-4 w-4 inline-block"/>Details</TabsTrigger>
          <TabsTrigger value="diagnoses"><Stethoscope className="mr-2 h-4 w-4 inline-block"/>Diagnoses</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4 inline-block"/>Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Patient Information</CardTitle>
              <Button variant="outline" onClick={handleEditDetailsToggle}>
                <Edit className="mr-2 h-4 w-4"/> {isEditingDetails ? 'Save Details' : 'Edit Details'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditingDetails ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="first_name">First Name</Label><Input name="first_name" value={editablePatientDetails.first_name || ''} onChange={handleDetailChange} /></div>
                            <div><Label htmlFor="last_name">Last Name</Label><Input name="last_name" value={editablePatientDetails.last_name || ''} onChange={handleDetailChange} /></div>
                        </div>
                        <div><Label htmlFor="email">Email</Label><Input name="email" type="email" value={editablePatientDetails.email || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="phone_number">Phone</Label><Input name="phone_number" type="tel" value={editablePatientDetails.phone_number || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="date_of_birth">Date of Birth</Label><Input name="date_of_birth" type="date" value={editablePatientDetails.date_of_birth || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="address">Address</Label><Textarea name="address" value={editablePatientDetails.address || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="id_number">ID Number</Label><Input name="id_number" value={editablePatientDetails.id_number || ''} onChange={handleDetailChange} /></div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <p><strong>Email:</strong> {patient.email}</p>
                            <p><strong>Phone:</strong> {patient.phone_number || 'N/A'}</p>
                            <p><strong>Address:</strong> {patient.address || 'N/A'}</p>
                            <p><strong>Joined:</strong> {new Date(patient.created_at).toLocaleDateString()}</p>
                        </div>
                    </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnoses">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Medical Diagnoses</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDiagnosis} className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-3">
                <h3 className="text-lg font-semibold">Add New Diagnosis</h3>
                <div>
                  <Label htmlFor="newDiagnosisText">Diagnosis Details *</Label>
                  <Textarea id="newDiagnosisText" value={newDiagnosisText} onChange={(e) => setNewDiagnosisText(e.target.value)} required rows={3} placeholder="Enter diagnosis information..."/>
                </div>
                <div>
                  <Label htmlFor="newDiagnosisDate">Diagnosis Date *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !newDiagnosisDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newDiagnosisDate ? format(newDiagnosisDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={newDiagnosisDate}
                            onSelect={setNewDiagnosisDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button type="submit" disabled={isAddingDiagnosis}><PlusCircle className="mr-2 h-4 w-4"/> {isAddingDiagnosis ? 'Adding...' : 'Add Diagnosis'}</Button>
              </form>
              {diagnoses.length === 0 ? <p>No diagnoses recorded.</p> : (
                <ul className="space-y-3">
                  {diagnoses.map(d => (
                    <li key={d.diagnosis_id} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{d.diagnosis_text}</p>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteDiagnosis(d.diagnosis_id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Diagnosed by {d.doctor_name || `Dr. ID ${d.diagnosed_by}`} on {new Date(d.diagnosis_date).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Patient Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDocumentUpload} className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-3">
                <h3 className="text-lg font-semibold">Upload New Document</h3>
                <div>
                  <Label htmlFor="documentFile">Choose File *</Label>
                  <Input id="documentFile" type="file" onChange={(e) => setDocumentFile(e.target.files ? e.target.files[0] : null)} required />
                </div>
                <div>
                  <Label htmlFor="documentName">Document Name (Optional)</Label>
                  <Input id="documentName" value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="If blank, filename will be used"/>
                </div>
                <div>
                  <Label htmlFor="documentType">Document Type (Optional)</Label>
                  <Input id="documentType" value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="e.g., Lab Result, Prescription, Imaging"/>
                </div>
                <Button type="submit" disabled={isUploading || !documentFile}><UploadCloud className="mr-2 h-4 w-4"/>{isUploading ? 'Uploading...' : 'Upload Document'}</Button>
              </form>
              {documents.length === 0 ? <p>No documents uploaded for this patient.</p> : (
                 <ul className="space-y-3">
                  {documents.map(doc => (
                    <li key={doc.document_id} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary hover:underline cursor-pointer" onClick={() => alert(`Mock download: ${doc.document_name}`)}>{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {doc.document_type || 'N/A'} | Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                       <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteDocument(doc.document_id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Patient Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <Image 
                  src={`https://placehold.co/150x150.png?text=${patient.first_name[0]}${patient.last_name[0]}`} 
                  alt={`${patient.first_name} ${patient.last_name}`} 
                  width={100} 
                  height={100} 
                  className="rounded-full border-2 border-primary"
                  data-ai-hint="profile avatar"
                />
                <div>
                    <p className="text-lg"><strong>Diagnoses Count:</strong> {diagnoses.length}</p>
                    <p className="text-lg"><strong>Documents Count:</strong> {documents.length}</p>
                    <p className="text-muted-foreground text-sm">Manage all aspects of this patient's profile using the tabs above.</p>
                </div>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
