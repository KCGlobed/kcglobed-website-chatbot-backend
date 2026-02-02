import { LangChainService } from "./LangChainService";
import { UserSession, ChatRequest, ChatResponse, Message } from "../models/ConversationState";

import { DatabaseService } from "./DatabaseService";

export class ChatService {
    private langChainService: LangChainService;
    private dbService: DatabaseService;
    private sessions: Map<string, UserSession>;

    constructor() {
        this.langChainService = new LangChainService();
        this.dbService = new DatabaseService();
        this.sessions = new Map();
    }

    private getOrCreateSession(sessionId: string): UserSession {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                stage: 'GREETING',
                messages: [],
                userData: {}
            });
        }
        return this.sessions.get(sessionId)!;
    }

    async handleMessage(sessionId: string, messageText: string, providedUserData?: any): Promise<ChatResponse> {
        const session = this.getOrCreateSession(sessionId);
        if (session.messages.length === 0 && session.stage === 'GREETING') {
            const greeting = "Hey! 👋 Welcome to KC GlobEd!\nI’m KC GlobEd Bot, here to guide you through courses, admissions, classes, and more.\nAsk me anything — I’m here 24/7!\n\nTo get started, what is your Name?";

            session.messages.push({ role: 'assistant', content: greeting });
            session.stage = 'WAITING_FOR_NAME';

            return {
                message: greeting,
            };
        }

        if (session.stage === 'WAITING_FOR_NAME') {
            session.messages.push({ role: 'user', content: messageText });

            // Name validation: Check if empty or too short
            const cleanedName = messageText.trim();
            if (cleanedName.length < 2) {
                const errorMsg = "Please enter a valid Name (at least 2 characters).";
                session.messages.push({ role: 'assistant', content: errorMsg });
                return { message: errorMsg };
            }

            // Check if user accidentally entered a phone number here
            if (/\d{10,}/.test(cleanedName)) {
                const errorMsg = "It looks like you entered a phone number. Please enter your Name first.";
                session.messages.push({ role: 'assistant', content: errorMsg });
                return { message: errorMsg };
            }

            if (!session.userData) session.userData = {};
            session.userData.name = cleanedName;

            const askPhoneMsg = `Thanks ${cleanedName}! Now, what is your Phone Number?`;
            session.messages.push({ role: 'assistant', content: askPhoneMsg });
            session.stage = 'WAITING_FOR_PHONE';
            return { message: askPhoneMsg };
        }

        if (session.stage === 'WAITING_FOR_PHONE') {
            session.messages.push({ role: 'user', content: messageText });

            // Phone validation: Look for at least 10 digits
            const phoneMatch = messageText.match(/\b\d{10,}\b/);

            if (phoneMatch) {
                const phoneNumber = phoneMatch[0];
                if (!session.userData) session.userData = {};
                session.userData.phoneNumber = phoneNumber;

                // Store in DB
                if (session.userData.name) {
                    await this.dbService.saveUser(session.userData.name, phoneNumber);
                }

                const uniqueOptions = ["Explore Courses", "Apply for Admission", "Access LMS / Student Login", "Ask a Question"];
                const msg = `Perfect! How can I help you today? Please select an option below:`;

                session.messages.push({ role: 'assistant', content: msg, options: uniqueOptions });
                session.stage = 'IDENTIFICATION';

                return {
                    message: msg,
                    options: uniqueOptions
                };
            } else {
                const errorMsg = "Please enter a valid Phone Number (at least 10 digits).";
                session.messages.push({ role: 'assistant', content: errorMsg });
                return { message: errorMsg };
            }
        }

        if (session.stage === 'IDENTIFICATION') {
            session.messages.push({ role: 'user', content: messageText });

            const lowerMessage = messageText.toLowerCase();

            if (lowerMessage.includes("lms") || lowerMessage.includes("login")) {
                session.userData!.userType = 'existing';
                const response = "As an existing student, do you need help with your login or course materials?";
                session.messages.push({ role: 'assistant', content: response });
                session.stage = 'OPEN_CHAT';
                return { message: response };
            } else if (lowerMessage.includes("explore") || lowerMessage.includes("admission")) {
                session.userData!.userType = 'new';
                const response = "Great! We can help you with admissions and guidance. What course are you interested in?";
                session.messages.push({ role: 'assistant', content: response });
                session.stage = 'OPEN_CHAT';
                return { message: response };
            } else if (lowerMessage.includes("counsellor") || lowerMessage.includes("person") || lowerMessage.includes("human") || lowerMessage.includes("agent") || lowerMessage.includes("call") || lowerMessage.includes("talk to")) {
                const response = "I have noted your request. Our executive will connect with you shortly on your registered phone number to assist you further. Is there anything else I can help you with?";
                session.messages.push({ role: 'assistant', content: response });
                session.stage = 'OPEN_CHAT';
                return { message: response };
            } else {
                session.userData!.userType = 'new';
            }
            session.stage = 'OPEN_CHAT';
        }

        session.messages.push({ role: 'user', content: messageText });
        const { content: aiResponse, confidence } = await this.langChainService.generateResponse(session.messages, messageText);
        session.messages.push({ role: 'assistant', content: aiResponse });

        // Log the interaction
        await this.dbService.logEvent("CHAT_RESPONSE", {
            sessionId,
            userMessage: messageText,
            botMessage: aiResponse,
            confidence,
            userData: session.userData
        });

        return { message: aiResponse };
    }
}
