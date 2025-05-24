'use server';

/**
 * @fileOverview An AI agent that allows doctors to customize the AI assistant's prompts and instructions.
 *
 * - customizeAiAssistant - A function that handles the customization of the AI assistant.
 * - CustomizeAiAssistantInput - The input type for the customizeAiAssistant function.
 * - CustomizeAiAssistantOutput - The return type for the customizeAiAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeAiAssistantInputSchema = z.object({
  doctorId: z.number().describe('The ID of the doctor customizing the AI assistant.'),
  instructionText: z.string().describe('The instruction text for the AI assistant.'),
  promptText: z.string().optional().describe('The prompt text for the AI assistant.'),
});
export type CustomizeAiAssistantInput = z.infer<typeof CustomizeAiAssistantInputSchema>;

const CustomizeAiAssistantOutputSchema = z.object({
  success: z.boolean().describe('Whether the AI assistant was successfully customized.'),
  message: z.string().describe('A message indicating the result of the customization.'),
});
export type CustomizeAiAssistantOutput = z.infer<typeof CustomizeAiAssistantOutputSchema>;

export async function customizeAiAssistant(input: CustomizeAiAssistantInput): Promise<CustomizeAiAssistantOutput> {
  return customizeAiAssistantFlow(input);
}

const customizeAiAssistantPrompt = ai.definePrompt({
  name: 'customizeAiAssistantPrompt',
  input: {schema: CustomizeAiAssistantInputSchema},
  output: {schema: CustomizeAiAssistantOutputSchema},
  prompt: `You are an AI assistant that helps doctors customize the behavior of a patient-facing AI chatbot.

A doctor with ID {{{doctorId}}} wants to customize the AI assistant with the following instruction and prompt texts:

Instruction Text: {{{instructionText}}}
Prompt Text: {{{promptText}}}

Respond with a JSON object indicating whether the customization was successful and a message indicating the result.
`,
});

const customizeAiAssistantFlow = ai.defineFlow(
  {
    name: 'customizeAiAssistantFlow',
    inputSchema: CustomizeAiAssistantInputSchema,
    outputSchema: CustomizeAiAssistantOutputSchema,
  },
  async input => {
    // TODO: Integrate with database to store the instructions and prompts.
    // Currently, it just returns a dummy success message.
    const {output} = await customizeAiAssistantPrompt(input);
    return output!;
  }
);
