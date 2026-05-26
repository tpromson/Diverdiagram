import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY_NOT_CONFIGURED" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentType = req.headers.get("content-type");
    if (!contentType || (!contentType.startsWith("image/") && contentType !== "application/pdf")) {
      return new Response(
        JSON.stringify({ error: "INVALID_FILE_TYPE" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Read the binary stream of the file from the request body
    const arrayBuffer = await req.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "EMPTY_FILE_UPLOADED" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert binary array buffer to base64 string
    const base64Data = encodeBase64(arrayBuffer);

    const modelName = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

    const prompt = `You are a professional clinical quality improvement analyst. 
Analyze the provided image or PDF page containing a Driver Diagram and transcribe its structure.
The diagram flows horizontally: Purpose/Outcome Goal (far left) -> Primary Drivers -> Secondary Drivers -> Interventions/Change Ideas (far right).
Please transcribe all titles and any associated KPIs or Indicators exactly as written in the diagram, preserving the original language (Thai or English).
Make sure to reconstruct the connections accurately so that secondary drivers are grouped under their correct parent primary drivers, and change ideas are grouped under their correct parent secondary drivers.
If a box has multiple bullet points or lines of text, separate them or include them as distinct change ideas.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        purpose: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The main goal or purpose of the diagram" },
            kpi: { type: "STRING", description: "Any outcome KPIs or indicators associated with the purpose" }
          },
          required: ["title"]
        },
        primaryDrivers: {
          type: "ARRAY",
          description: "List of primary drivers (the main areas of influence to achieve the goal)",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "The title of the primary driver" },
              kpi: { type: "STRING", description: "KPIs or indicators for the primary driver if any" },
              secondaryDrivers: {
                type: "ARRAY",
                description: "List of secondary drivers nested under this primary driver",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING", description: "The title of the secondary driver" },
                    kpi: { type: "STRING", description: "KPIs or indicators for the secondary driver if any" },
                    changeIdeas: {
                      type: "ARRAY",
                      description: "List of change ideas or interventions nested under this secondary driver",
                      items: {
                        type: "OBJECT",
                        properties: {
                          title: { type: "STRING", description: "The description of the change idea or intervention" },
                          kpi: { type: "STRING", description: "KPIs or indicators for the change idea if any" }
                        },
                        required: ["title"]
                      }
                    }
                  },
                  required: ["title"]
                }
              }
            },
            required: ["title"]
          }
        }
      },
      required: ["purpose", "primaryDrivers"]
    };

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    };

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API failed with status ${geminiResponse.status}` }), 
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await geminiResponse.json();
    const textResponse = result.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(textResponse);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
