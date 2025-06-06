
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Users, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
             <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16.75a.75.75 0 0 1-.75-.75V12.5a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-.75.75zm0-9a.75.75 0 0 1-.75-.75V8.5a.75.75 0 0 1 1.5 0v.5a.75.75 0 0 1-.75.75zM9.5 14.75a.75.75 0 0 1-.75-.75V10.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75zm5 0a.75.75 0 0 1-.75-.75V10.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75z"/>
                <path d="M12 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
            <h1 className="text-3xl font-bold text-primary">SAAIP</h1>
          </div>
          <nav className="space-x-4">
            <Button variant="ghost" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="text-center">
          <h2 className="text-5xl font-bold text-primary mb-6">Welcome to SAAIP</h2>
          <p className="text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Your intelligent partner in healthcare. Connecting doctors and patients with cutting-edge AI for seamless management and personalized assistance.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-16">
          <h3 className="text-4xl font-bold text-center text-primary mb-12">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Stethoscope size={48} className="text-accent" />
                </div>
                <CardTitle className="text-center text-2xl">For Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Manage patient data, customize AI assistants, and streamline your workflow efficiently. Upload and manage patient documents with ease.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Users size={48} className="text-accent" />
                </div>
                <CardTitle className="text-center text-2xl">For Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Access an AI-powered chatbot, schedule appointments automatically, and get helpful pill reminders.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Bot size={48} className="text-accent" />
                </div>
                <CardTitle className="text-center text-2xl">AI Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Leverage cutting-edge AI for intelligent assistance, prompt engineering, and automated tasks.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} SAAIP. All rights reserved.</p>
        <p className="text-sm text-muted-foreground">Innovating Health, Together.</p>
      </footer>
    </div>
  );
}
