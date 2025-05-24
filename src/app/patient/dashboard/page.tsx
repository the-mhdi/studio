
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CalendarPlus, Pill, Activity } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import Link from "next/link";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import Image from "next/image";

export default function PatientDashboardPage() {
  const { userProfile } = useAuthStore();

  return (
    <div>
      <DashboardHeader
        title={`Welcome, ${userProfile?.firstName || 'Patient'}`}
        description="Your personal health assistant is ready for you."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/patient/chat" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">AI Assistant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with our AI for information, symptom checks, or general health queries.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/appointments" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
               <div className="flex items-center gap-3 mb-2">
                <CalendarPlus className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Appointments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schedule new appointments or view your upcoming visits with your doctor.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/pill-reminder" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Pill className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">Pill Reminders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set up and manage your medication reminders to stay on track with your treatment.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-accent"/>
                Your Health Journey
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <Image 
              src="https://placehold.co/400x300.png" 
              alt="Patient using MediMind" 
              width={300} 
              height={225} 
              className="rounded-lg shadow-md"
              data-ai-hint="patient health app"
            />
            <div>
              <p className="text-muted-foreground mb-3">
                MediMind is here to support you every step of the way. Use our tools to manage your health proactively.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Ask the AI Assistant for quick health advice.</li>
                <li>Easily schedule appointments with your doctor.</li>
                <li>Never miss a dose with our Pill Reminder.</li>
              </ul>
              <p className="mt-3 text-sm text-primary">
                Remember, the AI assistant is for informational purposes and not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
