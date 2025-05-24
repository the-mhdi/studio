'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { customizeAiAssistant, type CustomizeAiAssistantInput } from '@/ai/flows/customize-ai-assistant';
import { useAuthStore } from '@/lib/authStore';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Bot, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function AiCustomizationPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [instructionText, setInstructionText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentInstructions, setCurrentInstructions] = useState<CustomizeAiAssistantInput | null>(null);


  // In a real app, you'd fetch current instructions for the doctor
  // useEffect(() => {
  //   const fetchInstructions = async () => {
  //     if (user) {
  //       // mock fetch
  //       // const fetched = await fetchDoctorInstructions(user.user_id);
  //       // setInstructionText(fetched.instruction_text);
  //       // setPromptText(fetched.prompt_text || '');
  //     }
  //   };
  //   fetchInstructions();
  // }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.user_type !== 'doctor') {
      toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const inputData: CustomizeAiAssistantInput = {
      doctorId: user.user_id,
      instructionText,
      promptText,
    };

    try {
      const result = await customizeAiAssistant(inputData);
      if (result.success) {
        toast({
          title: 'AI Assistant Updated',
          description: result.message || 'AI assistant customization saved successfully.',
        });
        setCurrentInstructions(inputData); // Store for display
      } else {
        toast({
          title: 'Update Failed',
          description: result.message || 'Could not save AI customization.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error customizing AI assistant:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Customize AI Assistant"
        description="Tailor the AI's behavior, knowledge, and responses for your patients."
      />

      <Alert className="mb-6 bg-primary/10 border-primary/30">
        <Bot className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary">Guidance for AI Customization</AlertTitle>
        <AlertDescription className="text-primary/80">
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Instruction Text:</strong> Define the AI's core personality, role, and limitations. E.g., "You are a helpful assistant for Dr. Smith's patients. Do not provide diagnoses. Always advise consulting Dr. Smith for serious issues."</li>
            <li><strong>Prompt Text (Optional):</strong> Provide specific question-answer pairs or scenarios to guide the AI's responses on particular topics relevant to your practice.</li>
            <li>Be clear and concise. Changes will apply to how the AI interacts with your patients.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Modify the instructions and prompts that guide the patient-facing AI chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="instructionText" className="text-lg font-semibold">
                Core Instruction Text
              </Label>
              <Textarea
                id="instructionText"
                placeholder="e.g., You are a friendly assistant for patients of MediMind Clinic. You should provide general health information and appointment scheduling help. Always encourage users to consult their doctor for medical advice."
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                rows={8}
                required
                className="text-base"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                This is the primary guidance for the AI. It defines its persona and general rules.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptText" className="text-lg font-semibold">
                Custom Prompts / Knowledge (Optional)
              </Label>
              <Textarea
                id="promptText"
                placeholder="e.g., Q: What are the clinic's opening hours? A: We are open Mon-Fri, 9 AM to 5 PM. \nQ: How to prepare for a blood test? A: Fast for 8 hours before your test..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={10}
                className="text-base"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Add specific question/answer pairs or scenarios to fine-tune responses. One per line is often best.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Saving Customization...' : 'Save AI Customization'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      {currentInstructions && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle>Current Saved Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary">Instruction Text:</h4>
              <p className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">{currentInstructions.instructionText}</p>
            </div>
            {currentInstructions.promptText && (
              <div>
                <h4 className="font-semibold text-primary">Prompt Text:</h4>
                <p className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">{currentInstructions.promptText}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
