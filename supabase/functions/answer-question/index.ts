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
    const { question, context, videoTitle, previousMessages } = await req.json();
    
    if (!question || !context) {
      throw new Error('Question and context are required');
    }

    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    console.log(`Processing question: "${question}" for video: "${videoTitle}"`);

    // Build the system prompt
    let systemPrompt = `You are an AI assistant that helps users understand video transcription data. 
You will be given context from a video transcription and answer questions about it.
The video title is: ${videoTitle}.

Here's the transcription context:
${context}

Answer the user's question based ONLY on the information in the transcription context.
If the answer cannot be determined from the context, say so clearly.
Keep your answers concise, informative, and directly related to the question.`;

    // Build the conversation history
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add previous conversation context if available
    if (previousMessages && previousMessages.length > 0) {
      // Only include the last 5 messages to keep the context manageable
      const recentMessages = previousMessages.slice(-5);
      recentMessages.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Add the current question
    messages.push({ role: "user", content: question });

    // Call Gemini API
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
    const response = await fetch(`${url}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
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
