
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, Bot, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp,getCountFromServer } from "firebase/firestore";
import { isFuture, parseISO } from "date-fns";
import type { PatientRecord, Appointment } from "@/lib/types";


interface SummaryData {
  totalPatients: number;
  upcomingAppointments: number;
}

export default function DoctorDashboardPage() {
  const { userProfile } = useAuthStore();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile || userProfile.userType !== 'doctor') {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch total patients
        const patientsQuery = query(collection(db, "patientRecords"), where("doctorId", "==", userProfile.uid));
        const patientsSnapshot = await getCountFromServer(patientsQuery);
        const totalPatients = patientsSnapshot.data().count;

        // Fetch upcoming appointments
        const now = new Date();
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", userProfile.uid)
          // Firestore does not directly support isFuture in queries. We fetch recent/future and filter client-side.
          // A more scalable solution might involve a 'status' field or querying by a date range.
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        let upcomingAppointmentsCount = 0;
        appointmentsSnapshot.forEach(doc => {
          const apt = doc.data() as Appointment;
          if (apt.appointmentDate && isFuture(parseISO(apt.appointmentDate))) {
            upcomingAppointmentsCount++;
          }
        });
        
        setSummaryData({
          totalPatients,
          upcomingAppointments: upcomingAppointmentsCount,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Keep summaryData as null or set to 0 to indicate error/no data
        setSummaryData({ totalPatients: 0, upcomingAppointments: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userProfile]);

  return (
    <div>
      <DashboardHeader
        title={`Welcome, Dr. ${userProfile?.lastName || 'Doctor'}`}
        description="Here's an overview of your practice today."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/doctor/patients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{summaryData?.totalPatients ?? 0}</div>}
              <p className="text-xs text-muted-foreground">Managed by you</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/appointments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{summaryData?.upcomingAppointments ?? 0}</div>}
              <p className="text-xs text-muted-foreground">Scheduled for the future</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/ai-customization">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Assistant Status</CardTitle>
            <Bot className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Ready to assist patients</p>
          </CardContent>
        </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
           <Link href="/doctor/patients/new" className="block">
            <Card className="bg-primary/10 hover:bg-primary/20 p-6 rounded-lg transition-colors text-center">
                <Users size={32} className="mx-auto mb-2 text-primary"/>
                <h3 className="text-lg font-semibold text-primary">Add New Patient Record</h3>
                <p className="text-sm text-muted-foreground">Create a data profile for a new patient.</p>
            </Card>
           </Link>
           <Link href="/doctor/ai-customization" className="block">
            <Card className="bg-accent/10 hover:bg-accent/20 p-6 rounded-lg transition-colors text-center">
                <Bot size={32} className="mx-auto mb-2 text-accent"/>
                <h3 className="text-lg font-semibold text-accent">Customize AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Tailor the AI's responses and behavior.</p>
            </Card>
           </Link>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-6 bg-card rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Doctor's Portal Guide</h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <Image src="https://placehold.co/400x300.png" alt="Doctor working" width={300} height={225} className="rounded-md shadow-md" data-ai-hint="doctor computer" />
          <div>
            <p className="text-muted-foreground mb-2">
              Utilize this portal to manage your patients, appointments, and the AI assistant. 
              Navigate using the sidebar to access different modules.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Patients:</strong> View, add, and edit patient records, including diagnoses and documents.</li>
              <li><strong>Appointments:</strong> Keep track of your schedule.</li>
              <li><strong>AI Customization:</strong> Fine-tune the AI assistant to better serve your patients.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
