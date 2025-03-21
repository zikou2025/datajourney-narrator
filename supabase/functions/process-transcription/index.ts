
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LogEntry {
  id?: string;
  timestamp?: string;
  location: string;
  activityCategory: string;
  activityType: string;
  equipment: string;
  personnel: string;
  material: string;
  measurement: string;
  status?: "completed" | "in-progress" | "planned" | "delayed" | "cancelled";
  notes: string;
  media?: string;
  referenceId?: string;
  coordinates?: [number, number];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    
    if (!text) {
      throw new Error('Transcription text is required')
    }

    // Process the transcription with enhanced analysis
    const logs = await processTranscriptionWithAI(text)

    return new Response(
      JSON.stringify({ logs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing transcription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Process transcription with AI enhancement
async function processTranscriptionWithAI(text: string): Promise<LogEntry[]> {
  try {
    // First use rule-based processing as a fallback approach
    const ruleBasedLogs = await processTranscription(text)
    
    // Try to enhance with Gemini AI if possible
    try {
      const enhancedLogs = await enhanceLogsWithGemini(text, ruleBasedLogs)
      return enhancedLogs
    } catch (aiError) {
      console.error('Error enhancing with Gemini, using rule-based logs:', aiError)
      return ruleBasedLogs
    }
  } catch (error) {
    console.error('Fallback to simple processing due to error:', error)
    return processTranscription(text)
  }
}

// Enhance logs using Gemini AI
async function enhanceLogsWithGemini(text: string, fallbackLogs: LogEntry[]): Promise<LogEntry[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key found, using rule-based processing')
    return fallbackLogs
  }
  
  try {
    // Format the prompt for Gemini
    const prompt = `
    Analyze this industrial activity transcription and extract structured information:
    
    ${text}
    
    Extract the following details for each distinct activity mentioned:
    - Location (where the activity took place)
    - Activity Category (Installation, Maintenance, Monitoring, Construction, Transportation, Extraction, Processing)
    - Activity Type (specific activity being performed)
    - Equipment used
    - Personnel involved
    - Materials used
    - Any measurements mentioned
    - Current status (completed, in-progress, planned, delayed, cancelled)
    - Notes (a concise summary of the activity)
    
    Format your response as a JSON array with the following structure:
    [{
      "location": "string",
      "activityCategory": "string",
      "activityType": "string",
      "equipment": "string",
      "personnel": "string",
      "material": "string",
      "measurement": "string",
      "status": "completed|in-progress|planned|delayed|cancelled",
      "notes": "string"
    }]
    
    Make sure to provide realistic, context-appropriate values for all fields. If information is not explicitly stated, make a reasonable inference based on context.
    `
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      })
    })
    
    const data = await response.json()
    console.log('Gemini API response:', JSON.stringify(data, null, 2))
    
    // Extract the logs from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content
      const textParts = content.parts.filter(part => part.text).map(part => part.text)
      const responseText = textParts.join('')
      
      // Find the JSON part in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        const logsFromAI = JSON.parse(jsonStr)
        
        // Process the AI-generated logs
        const enhancedLogs = logsFromAI.map((logItem, index) => {
          // Add missing fields or use defaults
          return {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            location: logItem.location || 'Unknown Location',
            activityCategory: logItem.activityCategory || 'Unspecified',
            activityType: logItem.activityType || `Activity ${index + 1}`,
            equipment: logItem.equipment || 'Unspecified Equipment',
            personnel: logItem.personnel || 'Unnamed Personnel',
            material: logItem.material || 'Unspecified Material',
            measurement: logItem.measurement || '',
            status: logItem.status || 'completed',
            notes: logItem.notes || '',
            referenceId: `REF-${Date.now().toString().slice(-5)}-${index}`,
          }
        })
        
        console.log('Enhanced logs with AI:', enhancedLogs)
        return enhancedLogs
      }
    }
    
    throw new Error('Could not parse Gemini response')
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return fallbackLogs
  }
}

// Original rule-based processing as fallback
async function processTranscription(text: string): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n|\r\n\r\n/).filter(p => p.trim().length > 0);
  
  // Locations we might extract
  const possibleLocations = [
    "Massey's Test Facility", "Sanchez Site", "Delta Junction", "North Ridge", 
    "West Portal", "South Basin", "East Quarry", "Central Processing"
  ];
  
  // Activities we might extract
  const activityCategories = {
    "Installation": ["install", "mounting", "placement", "setup"],
    "Maintenance": ["maintain", "repair", "service", "check", "inspect"],
    "Monitoring": ["monitor", "measure", "record", "analyze", "test"],
    "Construction": ["construct", "build", "assemble", "develop"],
    "Transportation": ["transport", "move", "ship", "deliver"],
    "Extraction": ["extract", "mine", "drill", "excavate"],
    "Processing": ["process", "refine", "treat", "filter"]
  };
  
  // Personnel types
  const personnelTypes = [
    "Engineer", "Technician", "Operator", "Supervisor", "Team", "Crew", "Specialist", "Consultant"
  ];
  
  // Equipment types
  const equipmentTypes = [
    "Excavator", "Drill", "Pump", "Crane", "Loader", "Truck", "Sensor", "Generator", 
    "Compressor", "Conveyor", "Filter", "Tank", "Valve", "Pipe"
  ];
  
  // Materials
  const materialTypes = [
    "Water", "Soil", "Rock", "Concrete", "Steel", "Sand", "Gravel", "Oil", 
    "Gas", "Chemical", "Cement", "Timber", "Clay", "Mineral"
  ];
  
  // Process each paragraph to extract information
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // Skip very short paragraphs
    if (paragraph.length < 20) continue;
    
    try {
      // Extract location
      let location = "Unknown Location";
      for (const loc of possibleLocations) {
        if (paragraph.includes(loc)) {
          location = loc;
          break;
        }
      }
      
      // Extract activity category and type
      let activityCategory = "Unspecified";
      let activityType = "";
      
      for (const [category, keywords] of Object.entries(activityCategories)) {
        for (const keyword of keywords) {
          if (paragraph.toLowerCase().includes(keyword)) {
            activityCategory = category;
            
            // Try to extract a specific activity type using surrounding words
            const regex = new RegExp(`\\b${keyword}\\w*\\b(?:\\s+\\w+){0,3}`, 'i');
            const match = paragraph.match(regex);
            if (match) {
              activityType = match[0].trim();
            } else {
              activityType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            }
            break;
          }
        }
        if (activityType) break;
      }
      
      // If we couldn't determine activity type, use the first sentence as a fallback
      if (!activityType) {
        const firstSentence = paragraph.split('.')[0];
        if (firstSentence.length > 10 && firstSentence.length < 100) {
          activityType = firstSentence.trim();
        } else {
          activityType = "Activity " + (i + 1);
        }
      }
      
      // Extract personnel
      let personnel = "Unnamed Personnel";
      for (const personType of personnelTypes) {
        if (paragraph.includes(personType)) {
          const regex = new RegExp(`(\\w+\\s+)?${personType}\\b`, 'i');
          const match = paragraph.match(regex);
          if (match) {
            personnel = match[0].trim();
          } else {
            personnel = personType;
          }
          break;
        }
      }
      
      // Extract equipment
      let equipment = "Unspecified Equipment";
      for (const equipType of equipmentTypes) {
        if (paragraph.includes(equipType)) {
          const regex = new RegExp(`(\\w+\\s+)?${equipType}\\b`, 'i');
          const match = paragraph.match(regex);
          if (match) {
            equipment = match[0].trim();
          } else {
            equipment = equipType;
          }
          break;
        }
      }
      
      // Extract material
      let material = "Unspecified Material";
      for (const matType of materialTypes) {
        if (paragraph.includes(matType)) {
          const regex = new RegExp(`(\\w+\\s+)?${matType}\\b`, 'i');
          const match = paragraph.match(regex);
          if (match) {
            material = match[0].trim();
          } else {
            material = matType;
          }
          break;
        }
      }
      
      // Extract measurement if present (looking for numbers with units)
      let measurement = "";
      const measurementRegex = /\b\d+(\.\d+)?\s*(meters|m|kg|liters|L|feet|ft|gallons|gal|psi|mph|tons)\b/i;
      const measureMatch = paragraph.match(measurementRegex);
      if (measureMatch) {
        measurement = measureMatch[0];
      }
      
      // Extract date if present
      let timestamp = new Date().toISOString();
      const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?,? \d{4}\b/i;
      const dateMatch = paragraph.match(dateRegex);
      if (dateMatch) {
        const dateStr = dateMatch[0];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          timestamp = date.toISOString();
        }
      }
      
      // Determine status (defaulting to completed)
      let status: "completed" | "in-progress" | "planned" | "delayed" | "cancelled" = "completed";
      if (paragraph.toLowerCase().includes("in progress") || paragraph.toLowerCase().includes("ongoing")) {
        status = "in-progress";
      } else if (paragraph.toLowerCase().includes("plan") || paragraph.toLowerCase().includes("schedule") || paragraph.toLowerCase().includes("will be")) {
        status = "planned";
      } else if (paragraph.toLowerCase().includes("delay") || paragraph.toLowerCase().includes("postpone")) {
        status = "delayed";
      } else if (paragraph.toLowerCase().includes("cancel") || paragraph.toLowerCase().includes("abort")) {
        status = "cancelled";
      }
      
      // Generate a log entry
      logs.push({
        id: crypto.randomUUID(),
        timestamp,
        location,
        activityCategory,
        activityType,
        equipment,
        personnel,
        material,
        measurement,
        status,
        notes: paragraph,
        referenceId: `REF-${Date.now().toString().slice(-5)}-${i}`,
      });
    } catch (error) {
      console.error("Error processing paragraph:", error);
      // Skip this paragraph if processing fails
    }
  }
  
  return logs;
}
