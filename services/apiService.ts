import { User, Student, Group, ChatMessage } from '../types';

const API_BASE_URL = 'http://localhost:5001/api'; // Your backend server URL

// Helper function for making API requests
const apiRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) { // No Content
            return null as T;
        }
        return response.json();
    } catch (error) {
        console.error(`API request failed: ${error}`);
        throw error;
    }
};

// --- User & Student Functions ---
export const loginUser = (user: User): Promise<Student> => {
    return apiRequest<Student>('/login', { method: 'POST', body: JSON.stringify(user) });
};

export const registerUser = (user: User): Promise<{ message: string; userId: string }> => {
    return apiRequest<{ message: string; userId: string }>('/register', { method: 'POST', body: JSON.stringify(user) });
};

export const getAllStudents = (): Promise<Student[]> => {
    return apiRequest<Student[]>('/students');
};

export const updateStudentProfile = (student: Student): Promise<Student> => {
    const { id, ...profileData } = student;
    return apiRequest<Student>(`/students/${student.username}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};


// --- Group Functions ---
export const getAllGroups = (): Promise<Group[]> => {
    return apiRequest<Group[]>('/groups');
};

export const createGroup = (group: Omit<Group, 'id' | 'messages'>): Promise<Group> => {
    return apiRequest<Group>('/groups', { method: 'POST', body: JSON.stringify(group) });
};

export const updateGroup = (group: Group): Promise<Group> => {
    const { id, ...groupData } = group;
    return apiRequest<Group>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(groupData) });
};

export const deleteGroup = (groupId: string): Promise<void> => {
    return apiRequest<void>(`/groups/${groupId}`, { method: 'DELETE' });
};

// --- Chat Message Functions ---

export const getChatMessages = (groupId: string): Promise<ChatMessage[]> => {
    return apiRequest<ChatMessage[]>(`/groups/${groupId}/messages`);
};

export const postChatMessage = (groupId: string, message: ChatMessage): Promise<ChatMessage> => {
    return apiRequest<ChatMessage>(`/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
    });
};
