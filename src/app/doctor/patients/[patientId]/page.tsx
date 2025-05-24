
'use client';

import { useEffect, useState, type FormEvent, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/authStore';
import type { PatientRecord, Diagnosis, PatientDocument, ChatMessage } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { User, Stethoscope, FileText, UploadCloud, PlusCircle, Edit, Trash2, CalendarIcon, MessageSquare, Bot as BotIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';


export default function PatientProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patientRecordId = params.patientId as string; // This is the Firestore document ID of the PatientRecord

  const { userProfile: doctorUserProfile } = useAuthStore();
  const { toast } = useToast();

  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editablePatientDetails, setEditablePatientDetails] = useState<Partial<PatientRecord>>({});

  // Form states for new diagnosis/document
  const [newDiagnosisText, setNewDiagnosisText] = useState('');
  const [newDiagnosisDate, setNewDiagnosisDate] = useState<Date | undefined>(new Date());
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingDiagnosis, setIsAddingDiagnosis] = useState(false);

  const activeTab = searchParams.get('tab') || 'details';
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientRecordId || !doctorUserProfile) {
        setError("Patient ID or doctor profile not available.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        // Fetch PatientRecord
        const patientDocRef = doc(db, "patientRecords", patientRecordId);
        const patientDocSnap = await getDoc(patientDocRef);

        if (!patientDocSnap.exists()) {
          setError("Patient record not found.");
          setPatientRecord(null);
          setIsLoading(false);
          return;
        }
        const recordData = patientDocSnap.data() as Omit<PatientRecord, 'recordId'>;
        const fetchedPatientRecord = { recordId: patientDocSnap.id, ...recordData };
        setPatientRecord(fetchedPatientRecord);
        setEditablePatientDetails(fetchedPatientRecord);

        // Fetch Diagnoses
        const diagnosesQuery = query(collection(db, "diagnoses"), where("patientRecordId", "==", patientRecordId));
        const diagnosesSnapshot = await getDocs(diagnosesQuery);
        const fetchedDiagnoses: Diagnosis[] = diagnosesSnapshot.docs.map(d => ({ diagnosisId: d.id, ...d.data() } as Diagnosis));
        setDiagnoses(fetchedDiagnoses.sort((a, b) => parseISO(b.diagnosisDate).getTime() - parseISO(a.diagnosisDate).getTime()));

        // Fetch Documents
        const documentsQuery = query(collection(db, "patientDocuments"), where("patientRecordId", "==", patientRecordId));
        const documentsSnapshot = await getDocs(documentsQuery);
        const fetchedDocuments: PatientDocument[] = documentsSnapshot.docs.map(d => ({ documentId: d.id, ...d.data() } as PatientDocument));
        setDocuments(fetchedDocuments.sort((a,b) => (b.uploadedAt as Timestamp).toMillis() - (a.uploadedAt as Timestamp).toMillis()));

        // Fetch Chat Messages if linkedAuthUid exists
        if (fetchedPatientRecord.linkedAuthUid) {
          const chatMessagesQuery = query(collection(db, "chatMessages"), where("patientAuthUid", "==", fetchedPatientRecord.linkedAuthUid));
          const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
          const fetchedChatMessages: ChatMessage[] = chatMessagesSnapshot.docs.map(chat => ({ chatId: chat.id, ...chat.data() } as ChatMessage));
          setChatMessages(fetchedChatMessages.sort((a,b) => (a.sentAt as Timestamp).toMillis() - (b.sentAt as Timestamp).toMillis()));
        } else {
          setChatMessages([]); // No linked user, so no chats to show this way
        }

      } catch (err: any) {
        console.error("Error fetching patient data:", err);
        setError(err.message || "Failed to fetch patient data.");
        setPatientRecord(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patientRecordId, doctorUserProfile]);


  useEffect(() => {
    if (activeTab === 'chatHistory' && scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [chatMessages, activeTab]);

  const handleEditDetailsToggle = async () => {
    if (isEditingDetails && patientRecord) { // Save logic
      setIsLoading(true);
      try {
        const patientDocRef = doc(db, "patientRecords", patientRecord.recordId!);
        const updateData = { ...editablePatientDetails };
        // Remove fields that shouldn't be directly updated or are handled by server
        delete updateData.recordId;
        delete updateData.doctorId;
        delete updateData.createdAt;
        // Ensure initialPassword is not accidentally cleared if not being edited
        if (!updateData.initialPassword && patientRecord.initialPassword) {
            updateData.initialPassword = patientRecord.initialPassword;
        }


        await updateDoc(patientDocRef, updateData);
        setPatientRecord(prev => ({...prev, ...editablePatientDetails} as PatientRecord));
        toast({ title: "Details Updated", description: `${patientRecord.firstName}'s details saved.`});
      } catch (e: any) {
        console.error("Error updating patient details:", e);
        toast({ title: "Update Failed", description: e.message || "Could not save details.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    } else if (patientRecord) {
        setEditablePatientDetails(patientRecord);
    }
    setIsEditingDetails(!isEditingDetails);
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditablePatientDetails(prev => ({...prev, [name]: value}));
  };


  const handleAddDiagnosis = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientRecord || !doctorUserProfile || !newDiagnosisDate) return;
    setIsAddingDiagnosis(true);
    try {
      const diagnosisData: Omit<Diagnosis, 'diagnosisId' | 'createdAt'> = {
        patientRecordId: patientRecord.recordId!,
        diagnosisText: newDiagnosisText,
        diagnosedBy: doctorUserProfile.uid,
        doctorName: `Dr. ${doctorUserProfile.firstName} ${doctorUserProfile.lastName}`,
        diagnosisDate: format(newDiagnosisDate, 'yyyy-MM-dd'),
      };
      const docRef = await addDoc(collection(db, "diagnoses"), { ...diagnosisData, createdAt: serverTimestamp() });
      setDiagnoses(prev => [{ ...diagnosisData, diagnosisId: docRef.id, createdAt: new Date().toISOString() }, ...prev]
        .sort((a, b) => parseISO(b.diagnosisDate).getTime() - parseISO(a.diagnosisDate).getTime()));
      setNewDiagnosisText('');
      setNewDiagnosisDate(new Date());
      toast({ title: 'Diagnosis Added', description: `New diagnosis recorded for ${patientRecord.firstName}.` });
    } catch (err: any) {
      console.error("Error adding diagnosis:", err);
      toast({ title: "Error Adding Diagnosis", description: err.message || "Could not save diagnosis.", variant: "destructive" });
    } finally {
      setIsAddingDiagnosis(false);
    }
  };

  const handleDocumentUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientRecord || !documentFile || !doctorUserProfile) return;
    setIsUploading(true);
    // In a real app: Upload documentFile to Firebase Storage, then save metadata to Firestore
    // For now, we'll just simulate metadata saving
    try {
      const documentData: Omit<PatientDocument, 'documentId' | 'uploadedAt'> = {
        patientRecordId: patientRecord.recordId!,
        documentName: documentName || documentFile.name,
        documentType: documentType,
        documentPath: `/uploads/mock/${documentFile.name}`, // Mock path, replace with actual Storage path
        uploadedBy: doctorUserProfile.uid,
      };
      const docRef = await addDoc(collection(db, "patientDocuments"), { ...documentData, uploadedAt: serverTimestamp() });
      setDocuments(prev => [{ ...documentData, documentId: docRef.id, uploadedAt: new Date().toISOString() }, ...prev]
        .sort((a,b) => (b.uploadedAt as any).toMillis() - (a.uploadedAt as any).toMillis())); // Basic sort for optimism
      setDocumentFile(null);
      setDocumentName('');
      setDocumentType('');
      toast({ title: 'Document Uploaded', description: `${documentData.documentName} added.` });
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toast({ title: "Error Uploading Document", description: err.message || "Could not save document metadata.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    try {
      await deleteDoc(doc(db, "diagnoses", diagnosisId));
      setDiagnoses(prev => prev.filter(d => d.diagnosisId !== diagnosisId));
      toast({ title: "Diagnosis Deleted", variant: "destructive"});
    } catch (err: any) {
      console.error("Error deleting diagnosis:", err);
      toast({ title: "Error Deleting Diagnosis", description: err.message || "Could not delete diagnosis.", variant: "destructive" });
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // In real app, also delete from Firebase Storage
      await deleteDoc(doc(db, "patientDocuments", documentId));
      setDocuments(prev => prev.filter(d => d.documentId !== documentId));
      toast({ title: "Document Deleted", variant: "destructive"});
    } catch (err: any) {
      console.error("Error deleting document:", err);
      toast({ title: "Error Deleting Document", description: err.message || "Could not delete document.", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Patient Data</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (!patientRecord) {
    return <div className="text-center py-10 text-muted-foreground">Patient record not found.</div>;
  }


  return (
    <div>
      <DashboardHeader
        title={`${patientRecord.firstName} ${patientRecord.lastName}`}
        description={`Patient ID: ${patientRecord.idNumber} | DOB: ${patientRecord.dateOfBirth ? format(parseISO(patientRecord.dateOfBirth), 'MM/dd/yyyy') : 'N/A'}`}
      />

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="details"><User className="mr-2 h-4 w-4 inline-block"/>Details</TabsTrigger>
          <TabsTrigger value="diagnoses"><Stethoscope className="mr-2 h-4 w-4 inline-block"/>Diagnoses</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4 inline-block"/>Documents</TabsTrigger>
          <TabsTrigger value="chatHistory"><MessageSquare className="mr-2 h-4 w-4 inline-block"/>AI Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Patient Information</CardTitle>
              <Button variant="outline" onClick={handleEditDetailsToggle} disabled={isLoading}>
                <Edit className="mr-2 h-4 w-4"/> {isEditingDetails ? (isLoading ? 'Saving...' : 'Save Details') : 'Edit Details'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditingDetails ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="firstName">First Name</Label><Input name="firstName" value={editablePatientDetails.firstName || ''} onChange={handleDetailChange} /></div>
                            <div><Label htmlFor="lastName">Last Name</Label><Input name="lastName" value={editablePatientDetails.lastName || ''} onChange={handleDetailChange} /></div>
                        </div>
                        <div><Label htmlFor="email">Email</Label><Input name="email" type="email" value={editablePatientDetails.email || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="phoneNumber">Phone</Label><Input name="phoneNumber" type="tel" value={editablePatientDetails.phoneNumber || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input name="dateOfBirth" type="date" value={editablePatientDetails.dateOfBirth || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="address">Address</Label><Textarea name="address" value={editablePatientDetails.address || ''} onChange={handleDetailChange} /></div>
                        <div><Label htmlFor="idNumber">ID Number</Label><Input name="idNumber" value={editablePatientDetails.idNumber || ''} onChange={handleDetailChange} /></div>
                         <div><Label htmlFor="patientSpecificPrompts">Patient Specific Prompts</Label><Textarea name="patientSpecificPrompts" value={editablePatientDetails.patientSpecificPrompts || ''} onChange={handleDetailChange} /></div>
                         <div><Label htmlFor="linkedAuthUid">Linked Patient Auth UID (Read-only)</Label><Input name="linkedAuthUid" value={editablePatientDetails.linkedAuthUid || ''} readOnly disabled /></div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <p><strong>Email:</strong> {patientRecord.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {patientRecord.phoneNumber || 'N/A'}</p>
                            <p><strong>Address:</strong> {patientRecord.address || 'N/A'}</p>
                             <p><strong>Joined (Record Created):</strong> {patientRecord.createdAt instanceof Timestamp ? patientRecord.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Patient Specific Prompts:</strong> {patientRecord.patientSpecificPrompts || 'N/A'}</p>
                            <p><strong>Linked Patient Auth UID:</strong> {patientRecord.linkedAuthUid || 'Not Linked'}</p>
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
                  <Textarea id="newDiagnosisText" value={newDiagnosisText} onChange={(e) => setNewDiagnosisText(e.target.value)} required rows={3} placeholder="Enter diagnosis information..." disabled={isAddingDiagnosis}/>
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
                            disabled={isAddingDiagnosis}
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
              {diagnoses.length === 0 ? <p className="text-center text-muted-foreground py-4">No diagnoses recorded.</p> : (
                <ul className="space-y-3">
                  {diagnoses.map(d => (
                    <li key={d.diagnosisId} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{d.diagnosisText}</p>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteDiagnosis(d.diagnosisId!)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Diagnosed by {d.doctorName || `Dr. ID ${d.diagnosedBy}`} on {d.diagnosisDate ? format(parseISO(d.diagnosisDate), 'MMMM d, yyyy') : 'N/A'}
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
                  <Input id="documentFile" type="file" onChange={(e) => setDocumentFile(e.target.files ? e.target.files[0] : null)} required disabled={isUploading}/>
                </div>
                <div>
                  <Label htmlFor="documentName">Document Name (Optional)</Label>
                  <Input id="documentName" value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="If blank, filename will be used" disabled={isUploading}/>
                </div>
                <div>
                  <Label htmlFor="documentType">Document Type (Optional)</Label>
                  <Input id="documentType" value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="e.g., Lab Result, Prescription" disabled={isUploading}/>
                </div>
                <Button type="submit" disabled={isUploading || !documentFile}><UploadCloud className="mr-2 h-4 w-4"/>{isUploading ? 'Uploading...' : 'Upload Document'}</Button>
              </form>
              {documents.length === 0 ? <p className="text-center text-muted-foreground py-4">No documents uploaded for this patient.</p> : (
                 <ul className="space-y-3">
                  {documents.map(doc => (
                    <li key={doc.documentId} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary hover:underline cursor-pointer" onClick={() => alert(`Mock download/view: ${doc.document_name} (Path: ${doc.document_path})`)}>{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {doc.documentType || 'N/A'} | Uploaded: {doc.uploadedAt instanceof Timestamp ? doc.uploadedAt.toDate().toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                       <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeleteDocument(doc.documentId!)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatHistory">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Assistant Chat History</CardTitle>
              <CardDescription>Conversation between {patientRecord.firstName} {patientRecord.lastName} and the MediMind AI.</CardDescription>
            </CardHeader>
            <CardContent>
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  {patientRecord.linkedAuthUid ? "No chat history found for this patient." : "Patient record is not linked to an authenticated patient account. Chat history cannot be displayed."}
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full p-4 border rounded-md bg-muted/20" ref={scrollAreaRef}>
                  <div className="space-y-6">
                    {chatMessages.map((message) => (
                      <div
                        key={message.chatId}
                        className={cn(
                          "flex items-end gap-3",
                          message.isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!message.isUser && (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <BotIcon size={24} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-xl px-4 py-3 shadow",
                            message.isUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-card-foreground border"
                          )}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.isUser ? patientRecord.firstName : message.senderName || "MediMind AI"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.messageText}</p>
                          <p className="mt-1 text-xs opacity-70 text-right">
                            {message.sentAt instanceof Timestamp ? format(message.sentAt.toDate(), "MMM d, HH:mm") : 'N/A'}
                          </p>
                        </div>
                        {message.isUser && (
                           <Avatar className="h-10 w-10">
                             <AvatarFallback>
                              <User size={24} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                  src={`https://placehold.co/100x100.png?text=${patientRecord.firstName[0]}${patientRecord.lastName[0]}`}
                  alt={`${patientRecord.firstName} ${patientRecord.lastName}`}
                  width={100}
                  height={100}
                  className="rounded-full border-2 border-primary"
                  data-ai-hint="profile avatar"
                />
                <div>
                    <p className="text-lg"><strong>Diagnoses Count:</strong> {diagnoses.length}</p>
                    <p className="text-lg"><strong>Documents Count:</strong> {documents.length}</p>
                    <p className="text-lg"><strong>Chat Messages:</strong> {chatMessages.length}</p>
                    <p className="text-muted-foreground text-sm">Manage all aspects of this patient's profile using the tabs above.</p>
                </div>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
