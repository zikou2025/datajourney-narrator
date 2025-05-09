
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, context, videoTitle, previousMessages, deepDive } = await req.json();
    
    if (!question || !context) {
      throw new Error('Question and context are required');
    }

    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    console.log(`Processing ${deepDive ? 'deep dive' : 'regular'} question: "${question}" for transcription: "${videoTitle}"`);

    // Build the system prompt based on whether this is a deep dive or regular question
    const systemPrompt = deepDive ? 
      `You are an expert AI assistant specializing in detailed analysis of video transcription data.
You will provide in-depth, comprehensive answers to questions about a transcription.
The transcription title is: ${videoTitle || "Untitled Transcription"}.

Here's the transcription context:
${context}

For this DEEP DIVE analysis:
1. Provide a thorough, detailed answer with specific examples from the transcription
2. Include relevant timestamps or sequence of events when applicable
3. Make connections between different parts of the transcription that relate to the question
4. Organize your response with clear sections if the answer is complex
5. If appropriate, mention implications or insights that could be derived from the information

Answer the user's question based ONLY on the information in the transcription context.
If the answer cannot be determined from the context, say so clearly.
Your answers should be comprehensive but focused on the specific question asked.` :
      `You are an AI assistant that helps users understand video transcription data. 
You will be given context from a transcription and answer questions about it.
The transcription title is: ${videoTitle || "Untitled Transcription"}.

Here's the transcription context:
${context}

Answer the user's question based ONLY on the information in the transcription context.
If the answer cannot be determined from the context, say so clearly.
Keep your answers concise, informative, and directly related to the question.`;

    // Build the conversation history for Gemini API
    const messages = [];
    
    // Add the system prompt as a separate message at the beginning
    messages.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    
    // Add a model response to acknowledge the system instructions
    messages.push({
      role: "model", 
      parts: [{ text: "I understand. I'll answer questions based only on the provided transcription context." }]
    });
    
    // Add previous conversation context if available
    if (previousMessages && previousMessages.length > 0) {
      // Only include the last 5 messages to keep the context manageable
      const recentMessages = previousMessages.slice(-5);
      
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add the current question
    messages.push({
      role: "user",
      parts: [{ text: question }]
    });

    // Call Gemini API with the correct format
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
    const response = await fetch(`${url}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: deepDive ? 0.3 : 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: deepDive ? 2048 : 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API");
    
    // Extract the answer from the Gemini response
    let answer = "I couldn't generate an answer based on the transcription.";
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      answer = data.candidates[0].content.parts[0].text;
    }

    return new Response(
      JSON.stringify({ answer }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error("Error in answer-question function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
