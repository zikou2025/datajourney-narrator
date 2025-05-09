
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract video ID from a YouTube URL
function extractYouTubeVideoId(url: string): string | null {
  // Handle youtube.com/watch?v= format
  let match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (match) return match[1];
  
  // Handle youtu.be/ format
  match = url.match(/youtu\.be\/([^?]+)/);
  if (match) return match[1];
  
  // Handle youtube.com/v/ format
  match = url.match(/youtube\.com\/v\/([^?]+)/);
  if (match) return match[1];
  
  // Handle youtube.com/embed/ format
  match = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (match) return match[1];
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    
    if (!youtubeUrl) {
      throw new Error('YouTube URL is required');
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Unable to extract video ID');
    }

    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    console.log(`Processing YouTube video: ${youtubeUrl} (ID: ${videoId})`);

    // Fetch video metadata first to get the title
    const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${geminiApiKey}&part=snippet`;
    let videoTitle = "Unknown";
    
    try {
      const videoInfoResponse = await fetch(videoInfoUrl);
      if (videoInfoResponse.ok) {
        const videoData = await videoInfoResponse.json();
        if (videoData.items && videoData.items.length > 0) {
          videoTitle = videoData.items[0].snippet.title;
        }
      }
    } catch (error) {
      console.error("Error fetching video info:", error);
    }

    // Build system prompt for Gemini
    const systemPrompt = `You are an AI assistant specialized in extracting and organizing transcriptions from YouTube videos.

I need you to watch this YouTube video: https://www.youtube.com/watch?v=${videoId}

Please provide the complete transcription of this video in a well-formatted way with timestamps when available. If the video doesn't have subtitles, please do your best to transcribe what's being said.

Format the transcription as a chronological record of what's discussed in the video. Include timestamps when speaker changes occur or new topics begin.

After providing the transcription, also include a brief (2-3 sentence) summary of the video's content.`;

    // Call Gemini API
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
    
    // Extract the transcription from the Gemini response
    let transcription = "Unable to extract transcription for this video.";
    let summary = "No summary available.";
    
    if (data.candidates && 
        data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const fullText = data.candidates[0].content.parts[0].text;
      
      // Extract summary (assuming it's at the end after "summary" keyword)
      const summaryMatch = fullText.match(/summary:?([\s\S]*?)$/i);
      if (summaryMatch && summaryMatch[1]) {
        summary = summaryMatch[1].trim();
        // Remove the summary part from the transcription
        transcription = fullText.replace(/summary:?([\s\S]*?)$/i, '').trim();
      } else {
        transcription = fullText;
      }
    }

    // Structure the logs as would be expected by the TranscriptionQA component
    const currentDate = new Date().toISOString();
    const logs = [
      {
        episodeId: `youtube-${videoId}`,
        timestamp: currentDate,
        activityType: "Transcription",
        location: "YouTube",
        notes: transcription
      },
      {
        episodeId: `youtube-${videoId}`,
        timestamp: currentDate,
        activityType: "Summary",
        location: "YouTube",
        notes: summary
      }
    ];

    return new Response(
      JSON.stringify({ 
        transcription, 
        summary, 
        videoTitle,
        videoId,
        logs
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error("Error in extract-youtube-transcription function:", error);
    
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
