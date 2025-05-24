
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit3, FileText, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import type { Patient } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Badge } from '@/components/ui/badge';

// Mock patient data
const MOCK_PATIENTS: Patient[] = [
  { user_id: 1, username: 'alice_p', email: 'alice.p@example.com', first_name: 'Alice', last_name: 'Smith', user_type: 'patient', created_at: '2023-01-15T10:00:00Z', id_number: 'P001', date_of_birth: '1990-05-20', address: '123 Health St, Wellness City', phone_number: '555-0101' },
  { user_id: 2, username: 'bob_k', email: 'bob.k@example.com', first_name: 'Bob', last_name: 'Johnson', user_type: 'patient', created_at: '2023-02-20T11:30:00Z', id_number: 'P002', date_of_birth: '1985-11-12', address: '456 Care Ave, Remedy Town', phone_number: '555-0102' },
  { user_id: 3, username: 'carol_w', email: 'carol.w@example.com', first_name: 'Carol', last_name: 'Williams', user_type: 'patient', created_at: '2023-03-10T09:15:00Z', id_number: 'P003', date_of_birth: '1995-08-03', address: '789 Life Rd, Vitality Village', phone_number: '555-0103' },
  { user_id: 4, username: 'david_b', email: 'david.b@example.com', first_name: 'David', last_name: 'Brown', user_type: 'patient', created_at: '2023-04-05T14:00:00Z', id_number: 'P004', date_of_birth: '1978-02-25', address: '101 Healthway, Cureburg', phone_number: '555-0104' },
];

export default function DoctorPatientsPage() {
  const { user } = useAuthStore(); // Assuming doctor is logged in
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, fetch patients for this doctor
    if (user) {
      // MOCK: Simulating fetching patients associated with this doctor
      setPatients(MOCK_PATIENTS);
    }
  }, [user]);

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id_number.toLowerCase().includes(searchTerm.toLowerCase())
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
          {filteredPatients.length === 0 ? (
            <div className="text-center py-10">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No patients found matching your criteria.</p>
              {patients.length > 0 && searchTerm && (
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
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.user_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{patient.first_name} {patient.last_name}</TableCell>
                      <TableCell>{patient.id_number}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="mr-2">
                          <Link href={`/doctor/patients/${patient.user_id}`}>
                            <Edit3 className="h-4 w-4 mr-1" /> View/Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/doctor/patients/${patient.user_id}?tab=documents`}>
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
         {filteredPatients.length > 0 && (
            <CardDescription className="p-6 pt-0 text-sm text-muted-foreground">
                Showing {filteredPatients.length} of {patients.length} total patients.
            </CardDescription>
         )}
      </Card>
    </div>
  );
}
