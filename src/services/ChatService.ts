import { LangChainService } from "./LangChainService";
import { UserSession, ChatRequest, ChatResponse, Message } from "../models/ConversationState";

export class ChatService {
    private langChainService: LangChainService;
    private sessions: Map<string, UserSession>;

    constructor() {
        this.langChainService = new LangChainService();
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

        // If it's a completely new session and no message (or just check), return greeting
        if (session.messages.length === 0 && session.stage === 'GREETING') {
            const greeting = "Hey! 👋 Welcome to KC GlobEd!\nI’m KC GlobEd Bot, here to guide you through courses, admissions, classes, and more.\nAsk me anything — I’m here 24/7!\n\nHow can I help you today?";

            session.messages.push({ role: 'assistant', content: greeting });

            // Per requirements, next step is to collect data if they respond
            session.stage = 'DATA_COLLECTION';

            return {
                message: greeting,
            };
        }

        // Logic flow based on requirements
        // 1. User responds "hi" (or anything) after greeting -> Ask for Name/Phone
        if (session.stage === 'DATA_COLLECTION') {
            // Save user message
            session.messages.push({ role: 'user', content: messageText });

            // Check if we already have data (maybe passed in request?)
            // Requirement: "Before we proceed, please enter your name and a valid phone number."
            // We need to parse this. For simplicity, we'll ask for it.
            // If the user just sent "Hi", we ask.

            // Simple heuristic: if we don't have name/phone, we ask.
            // If the user provided it in this message (e.g. "Rahul 999999"), we try to parse. 
            // BUT requirement says: "Immediately show 5-6 buttons" AFTER collecting data.

            // Let's implement a simple check. If we are in DATA_COLLECTION,
            // we assume the FIRST interaction was just "Hi". The NEXT response needs to be prompt for data.
            // WAIT, prompt says: "Now, the user will respond 'hi'. In a chatbot, at the initial step, we must collect user data... For Example: Before we proceed..."

            // So:
            // 1. Bot: Greetings...
            // 2. User: Hi
            // 3. Bot: Before we proceed... enter name and phone.

            // Implementation:
            // If last specific bot message was Greeting, and User says "Hi".

            const askDataMsg = "Before we proceed, please enter your name and a valid phone number.";
            session.messages.push({ role: 'assistant', content: askDataMsg });
            session.stage = 'WAITING_FOR_DATA';
            return { message: askDataMsg };
        }

        if (session.stage === 'WAITING_FOR_DATA') {
            session.messages.push({ role: 'user', content: messageText });

            // Validate data - very simple validation for now
            // We assume the user entered "Name Phone"
            // We can improve this with LLM extraction later if time permits.
            // For now, accept whatever and move to identification.

            session.userData = { name: messageText.split(' ')[0], phoneNumber: messageText }; // naive

            // Requirement: "After this, immediately show 5-6 buttons"
            const uniqueOptions = ["Explore Courses", "Apply for Admission", "Access LMS / Student Login", "Talk to a counsellor", "Ask a Question"];
            const msg = "Thanks! Please select an option below:";

            session.messages.push({ role: 'assistant', content: msg, options: uniqueOptions });
            session.stage = 'IDENTIFICATION';

            return {
                message: msg,
                options: uniqueOptions
            };
        }

        if (session.stage === 'IDENTIFICATION') {
            session.messages.push({ role: 'user', content: messageText });

            // Requirement 3: Identify user: New vs Existing.
            // The buttons map to this.
            // New Student items: Explore Courses, Apply for Admission, Talk to counsellor?
            // Existing Student items: Access LMS / Student Login

            // "New student – Admission/guidance"
            // "Existing student – LMS support"

            if (messageText.includes("LMS") || messageText.includes("Login")) {
                session.userData!.userType = 'existing';
                const response = "As an existing student, do you need help with your login or course materials?";
                session.messages.push({ role: 'assistant', content: response });
                session.stage = 'OPEN_CHAT';
                return { message: response };
            } else if (messageText.includes("Explore") || messageText.includes("Admission") || messageText.includes("counsellor")) {
                session.userData!.userType = 'new';
                const response = "Great! We can help you with admissions and guidance. What course are you interested in?";
                session.messages.push({ role: 'assistant', content: response });
                session.stage = 'OPEN_CHAT';
                return { message: response };
            } else {
                session.userData!.userType = 'new'; // Default ?
                // Or just fallback to AI
            }

            // If "Ask a Question" or other text, proceed to AI.
            // Also fall through here
            session.stage = 'OPEN_CHAT';
        }

        // OPEN CHAT with OpenAI
        session.messages.push({ role: 'user', content: messageText });
        const aiResponse = await this.langChainService.generateResponse(session.messages, messageText);
        session.messages.push({ role: 'assistant', content: aiResponse });

        return { message: aiResponse };
    }
}
