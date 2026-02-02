export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    options?: string[];
}

export interface UserSession {
    id: string;
    stage: 'GREETING' | 'WAITING_FOR_NAME' | 'WAITING_FOR_PHONE' | 'IDENTIFICATION' | 'OPEN_CHAT';
    userData?: {
        name?: string;
        phoneNumber?: string;
        userType?: 'new' | 'existing';
    };
    messages: Message[];
}

export interface ChatRequest {
    sessionId: string;
    message: string;
    userData?: {
        name?: string;
        phoneNumber?: string;
    }
}

export interface ChatResponse {
    message: string;
    options?: string[];
    stage?: string;
}
