export interface User {
  username: string;
  password?: string; // Optional for security, won't be stored in frontend state long-term
}

export interface Student extends User {
  id: string;
  name: string;
  courses: string[];
  cgpa: string;
  availability: string[];
}

export interface Group {
  id: string;
  groupName: string;
  members: string[]; // member usernames
  admin: string; // username of the admin
  reason: string; // Original reason for creation
  reasoning?: string; // AI's reason for suggesting this group to the current user
  suggestedTimes: string[];
  focusCourses: string[];
  messages?: ChatMessage[]; // Added to store chat history
}

export interface MatchedStudent {
  name: string;
  username: string;
  reasoning: string;
  courses: string[];
  cgpa: string;
}

export interface OnlineResourceItem {
  title: string;
  description: string;
  url: string;
  category: string;
  youtubeVideoId?: string;
}

export interface OnlineResource {
  summary: string;
  resources: OnlineResourceItem[];
}

export interface ChatMessage {
  id: string;
  sender: string; // username of the sender
  text: string;
  timestamp: string;
  parentId?: string; // ID of the message this is a reply to
  reactions?: { [emoji: string]: string[] }; // Key: emoji, Value: array of usernames
}

export interface AISuggestions {
  matchedStudents: MatchedStudent[];
  matchedGroups: Group[];
  onlineResources: OnlineResource;
}
