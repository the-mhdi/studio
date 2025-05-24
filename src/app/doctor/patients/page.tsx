
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit3, FileText, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import type { PatientRecord } from '@/lib/types'; // Changed from Patient
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function DoctorPatientsPage() {
  const { userProfile: doctorUserProfile } = useAuthStore();
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientRecords = async () => {
      if (doctorUserProfile && doctorUserProfile.userType === 'doctor') {
        setIsLoading(true);
        setError(null);
        try {
          console.log(`Fetching patient records for doctor ID: ${doctorUserProfile.uid}`);
          const patientRecordsRef = collection(db, "patientRecords");
          const q = query(patientRecordsRef, where("doctorId", "==", doctorUserProfile.uid));
          const querySnapshot = await getDocs(q);
          
          const records: PatientRecord[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<PatientRecord, 'recordId'>; // Data from Firestore
            records.push({ 
              recordId: doc.id, 
              ...data,
              // Ensure createdAt is correctly handled if it's a Firestore Timestamp
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            });
          });
          console.log(`Fetched ${records.length} patient records:`, records);
          setPatientRecords(records);
        } catch (err: any) {
          console.error("Error fetching patient records:", err);
          setError(err.message || "Failed to fetch patient records. Please check console.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        if (!doctorUserProfile) {
          setError("Doctor profile not loaded. Cannot fetch patients.");
        }
      }
    };

    fetchPatientRecords();
  }, [doctorUserProfile]);

  const filteredPatients = patientRecords.filter(record =>
    `${record.firstName} ${record.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.email && record.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    record.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <DashboardHeader
        title="Manage Patients"
        description="View, edit, and add patient profiles."
        actions={
          <Button asChild>
            <Link href="/doctor/patients/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Patient
            </Link>
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/> Patient List</CardTitle>
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading patient records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              <AlertTriangle size={48} className="mx-auto mb-4" />
              <p>Error: {error}</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-10">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {patientRecords.length === 0 ? "No patient records found for you." : "No patients found matching your search criteria."}
              </p>
              {patientRecords.length > 0 && searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>Clear search</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((record) => (
                    <TableRow key={record.recordId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{record.firstName} {record.lastName}</TableCell>
                      <TableCell>{record.idNumber}</TableCell>
                      <TableCell>{record.email || 'N/A'}</TableCell>
                      <TableCell>{record.dateOfBirth ? format(new Date(record.dateOfBirth), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                      <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="mr-2">
                          <Link href={`/doctor/patients/${record.recordId}`}>
                            <Edit3 className="h-4 w-4 mr-1" /> View/Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/doctor/patients/${record.recordId}?tab=documents`}>
                            <FileText className="h-4 w-4 mr-1" /> Docs
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         {filteredPatients.length > 0 && !isLoading && !error && (
            <CardDescription className="p-6 pt-0 text-sm text-muted-foreground">
                Showing {filteredPatients.length} of {patientRecords.length} total patients.
            </CardDescription>
         )}
      </Card>
    </div>
  );
}
