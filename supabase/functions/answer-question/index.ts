
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
    const { question, context, videoTitle, previousMessages, deepDive, generateQuestions } = await req.json();
    
    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    // If generateQuestions is true, create a set of Q&A pairs
    if (generateQuestions) {
      if (!context) {
        throw new Error('Context is required for generating questions');
      }

      console.log(`Generating questions and answers for transcription: "${videoTitle || 'Untitled'}"`);
      
      const systemPrompt = `You are an expert AI assistant specializing in analysis of transcription data.
The transcription title is: ${videoTitle || "Untitled Transcription"}.

Here's the transcription context:
${context}

Generate a comprehensive set of questions and answers about this transcription, organized by complexity level.
For each complexity level, create 5 questions with detailed answers:

1. Basic Questions: Simple factual questions directly answered in the transcription
2. Intermediate Questions: Questions requiring some inference or connecting information from different parts
3. Advanced Questions: Questions requiring deeper analysis, causes/effects, implications, etc.

Format your response as a JSON array with this structure:
[
  {
    "level": "Basic",
    "questions": [
      {
        "question": "Question text here?",
        "answer": "Detailed answer here"
      },
      // more questions...
    ]
  },
  {
    "level": "Intermediate",
    "questions": [
      // questions...
    ]
  },
  {
    "level": "Advanced",
    "questions": [
      // questions...
    ]
  }
]

Base all questions and answers ONLY on information in the transcription.
If there isn't enough information for all 15 questions, generate as many as possible.
Make sure answers are detailed and reference specific parts of the transcription.
DO NOT include any explanations, only return the valid JSON.`;

      try {
        // Call Gemini API with the correct format
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
        const response = await fetch(`${url}?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API Error: ${response.status} - ${errorText}`);
          
          // Handle rate limiting specifically
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '30';
            // Try to extract retry time from error response
            let retrySeconds = 30;
            try {
              const errorJson = JSON.parse(errorText);
              const retryInfo = errorJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
              if (retryInfo?.retryDelay) {
                const delay = retryInfo.retryDelay;
                // Convert "10s" to 10
                retrySeconds = parseInt(delay.replace('s', '')) || 30;
              }
            } catch (e) {
              console.error('Error parsing retry info:', e);
            }
            
            return new Response(
              JSON.stringify({ 
                error: "API rate limit exceeded", 
                message: "The Gemini API rate limit has been reached. Please try again in a few moments.",
                retryAfter: retrySeconds 
              }),
              {
                status: 429,
                headers: { 
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'Retry-After': String(retrySeconds)
                },
              }
            );
          }
          
          throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the JSON response from the Gemini output
        let questionsAndAnswers = [];
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          
          const responseText = data.candidates[0].content.parts[0].text;
          
          // Extract JSON from the response text
          try {
            // Find the JSON part in the text (in case there's extra text)
            const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              questionsAndAnswers = JSON.parse(jsonMatch[0]);
            } else {
              questionsAndAnswers = JSON.parse(responseText);
            }
          } catch (jsonError) {
            console.error("Error parsing JSON from Gemini response:", jsonError);
            throw new Error("Failed to parse Q&A JSON from Gemini");
          }
        }

        return new Response(
          JSON.stringify({ questionsAndAnswers }),
          {
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            },
          }
        );
      } catch (error) {
        console.error("Error calling Gemini API for questions:", error);
        return new Response(
          JSON.stringify({ 
            error: "API Error", 
            message: "There was a problem generating questions. Please try again later." 
          }),
          {
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            },
          }
        );
      }
    }
    
    // If not generating questions, proceed with the regular Q&A flow
    if (!question || !context) {
      throw new Error('Question and context are required');
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

    try {
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
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '30';
          // Try to extract retry time from error response
          let retrySeconds = 30;
          try {
            const errorJson = JSON.parse(errorText);
            const retryInfo = errorJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              const delay = retryInfo.retryDelay;
              // Convert "10s" to 10
              retrySeconds = parseInt(delay.replace('s', '')) || 30;
            }
          } catch (e) {
            console.error('Error parsing retry info:', e);
          }
          
          return new Response(
            JSON.stringify({ 
              error: "API rate limit exceeded", 
              message: "The Gemini API rate limit has been reached. Please try again in a few moments.",
              retryAfter: retrySeconds 
            }),
            {
              status: 429,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': String(retrySeconds)
              },
            }
          );
        }
        
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
      console.error("Error calling Gemini API:", error);
      return new Response(
        JSON.stringify({ 
          error: "API Error", 
          message: "There was a problem with the AI service. Please try again later." 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }

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
