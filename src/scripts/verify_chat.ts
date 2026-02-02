import axios from 'axios';

const API_URL = 'http://localhost:3000/api/chat';
const sessionId = `test-session-${Date.now()}`;

async function sendMessage(message: string, expectedContent?: string) {
    console.log(`\nSending: "${message}"`);
    try {
        const response = await axios.post(API_URL, {
            sessionId: sessionId,
            message: message
        });
        const botMessage = response.data.message;
        console.log(`Bot: "${botMessage}"`);

        if (expectedContent) {
            if (botMessage.toLowerCase().includes(expectedContent.toLowerCase())) {
                console.log("✅ Verified");
            } else {
                console.error(`❌ Failed: Expected to contain "${expectedContent}"`);
            }
        }
        return botMessage;
    } catch (error) {
        console.error("Error:", error.message);
    }
}

async function runTest() {
    console.log("Starting Chat Flow Verification...");

    // 1. Greeting
    await sendMessage("Hi", "what is your Name");

    // 2. Invalid Name
    await sendMessage("A", "valid Name");

    // 3. Valid Name
    await sendMessage("Alice", "Phone Number");

    // 4. Invalid Phone
    await sendMessage("123", "valid Phone Number");

    // 5. Valid Phone
    await sendMessage("9876543210", "How can I help you");

    // 6. Normal Chat
    await sendMessage("I want to know about courses", "");

    // 7. Human Handoff Test
    await sendMessage("I want to talk to a person", "executive will connect with you");
}

runTest();
