import { GoogleGenAI, Type } from "@google/genai";
import { Student, Group, AISuggestions, OnlineResource, MatchedStudent, ChatMessage } from '../types';

let ai: GoogleGenAI;

// Initialize the AI client on-demand to prevent app crash on load if API key is missing.
const getAIClient = () => {
    if (!process.env.API_KEY) {
        throw new Error(
            'Gemini API key not found. Please add an API_KEY to your .env file in the `frontend` directory and restart the server.'
        );
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


// Schemas for the structured JSON response
const matchedStudentSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the matched student." },
        username: { type: Type.STRING, description: "The unique username of the matched student." },
        reasoning: { type: Type.STRING, description: "A detailed explanation of why this student is a good match, focusing on shared courses, similar CGPA, and compatible availability." },
        courses: { type: Type.ARRAY, items: { type: Type.STRING } },
        cgpa: { type: Type.STRING, description: "The student's academic CGPA." },
    },
    required: ["name", "username", "reasoning", "courses", "cgpa"]
};

const matchedGroupSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "The unique ID of the existing group." },
        groupName: { type: Type.STRING },
        members: { type: Type.ARRAY, items: { type: Type.STRING } },
        focusCourses: { type: Type.ARRAY, items: { type: Type.STRING } },
        reasoning: { type: Type.STRING, description: "A detailed explanation of why this group is a good fit for the current user." },
        // required for consistency, but won't be part of the final type
        reason: { type: Type.STRING },
        suggestedTimes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["id", "groupName", "members", "focusCourses", "reasoning", "reason", "suggestedTimes"]
};

const onlineResourceSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief, encouraging summary (2-3 sentences) to introduce these resources." },
        resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A brief one-sentence description." },
                    url: { type: Type.STRING },
                    category: { type: Type.STRING, description: "A category like 'YouTube Video', 'Interactive Platform', 'Documentation'." },
                    youtubeVideoId: { type: Type.STRING, description: "The 11-character YouTube video ID, or an empty string if not applicable." },
                },
                required: ["title", "description", "url", "category", "youtubeVideoId"]
            }
        }
    },
    required: ["summary", "resources"]
};


export const getAISuggestions = async (currentUser: Student, allOtherStudents: Student[], allGroups: Group[]): Promise<AISuggestions> => {
    const studentProfile = JSON.stringify({
        name: currentUser.name,
        courses: currentUser.courses,
        cgpa: currentUser.cgpa,
        availability: currentUser.availability,
    }, null, 2);

    const otherStudentsData = JSON.stringify(allOtherStudents.map(s => ({ name: s.name, username: s.username, courses: s.courses, cgpa: s.cgpa })), null, 2);
    const existingGroupsData = JSON.stringify(allGroups.map(g => ({ id: g.id, groupName: g.groupName, members: g.members, focusCourses: g.focusCourses })), null, 2);

    const systemInstruction = `
You are the **Lead Facilitator** of a specialized 'Crew AI' dedicated to fostering academic collaboration and success. Your mission is to orchestrate a team of AI agents to provide the most personalized and effective recommendations for a student.

Your crew consists of:
1.  **Academic Analyst Agent**: This agent meticulously compares the current user's profile (courses, CGPA, availability) against a list of other students to find ideal peer matches. It prioritizes shared academic interests and compatible performance levels.
2.  **Community Manager Agent**: This agent evaluates all existing study groups. It identifies groups where the user's academic needs align with the group's focus courses and where they would be a valuable addition.
3.  **Resource Curator Agent**: This agent scours its vast knowledge base for high-quality, relevant online learning resources, with a preference for engaging formats like YouTube videos, that directly map to the user's courses.

Your final task as the **Lead Facilitator** is to synthesize the findings from your entire crew into a single, cohesive JSON object. The reasoning provided for each match should reflect the collaborative analysis of your team. You must provide your response as a single, raw JSON object conforming to the provided schema. Do not add any extra text or markdown formatting.
`;

    const prompt = `
Lead Facilitator, here is the data for your crew's analysis:

Current User Profile:
${studentProfile}

List of Other Students Available for the Academic Analyst:
${otherStudentsData}

List of Existing Groups for the Community Manager:
${existingGroupsData}

Please orchestrate your crew and generate the final JSON output with comprehensive suggestions for the user, ${currentUser.name}.
`;

    try {
        const aiClient = getAIClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchedStudents: { type: Type.ARRAY, items: matchedStudentSchema },
                        matchedGroups: { type: Type.ARRAY, items: matchedGroupSchema },
                        onlineResources: onlineResourceSchema
                    },
                    required: ["matchedStudents", "matchedGroups", "onlineResources"]
                },
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("The AI returned an empty response.");
        }

        const result = JSON.parse(jsonText);

        // The AI might return a full group object. We need to merge its 'reasoning' with the original group data.
        const mergedGroups = result.matchedGroups.map((suggestedGroup: Group) => {
            const originalGroup = allGroups.find(g => g.id === suggestedGroup.id);
            return originalGroup ? { ...originalGroup, reasoning: suggestedGroup.reasoning } : suggestedGroup;
        });

        return {
            matchedStudents: result.matchedStudents as MatchedStudent[],
            matchedGroups: mergedGroups,
            onlineResources: result.onlineResources as OnlineResource
        };

    } catch (error) {
        console.error("Error calling Gemini API for suggestions:", error);
        if (error instanceof SyntaxError) {
            throw new Error("Failed to parse the AI's response. The data might be malformed.");
        }
        const errorMessage = error instanceof Error && error.message ? error.message : "An unknown error occurred.";
        throw new Error(`An error occurred while communicating with the AI for suggestions. Details: ${errorMessage}`);
    }
};


export const getAIChatResponse = async (chatHistory: ChatMessage[], prompt: string): Promise<string> => {
    const systemInstruction = `You are a helpful and friendly AI study assistant integrated into a group chat. Your name is 'StudyBot'. Analyze the provided chat history for context and answer the user's question directly. Keep your answers concise, informative, and encouraging. Address the user's query about their study topics.`;

    // Format the chat history for the model
    const history = chatHistory
        .filter(msg => msg.sender !== 'System') // Exclude system messages from context
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

    const fullPrompt = `
Here is the recent chat history for context:
---
${history}
---

Now, a user has asked for your help.
User's message: "${prompt}"

Please provide a helpful response.
`;

    try {
        const aiClient = getAIClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for chat response:", error);
        return "Sorry, I encountered an error and couldn't process your request right now.";
    }
};