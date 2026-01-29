"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const ChatService_1 = require("../services/ChatService");
class ChatController {
    constructor() {
        this.handleChat = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId, message, userData } = req.body;
                if (!sessionId) {
                    return res.status(400).json({ error: "Session ID is required" });
                }
                const response = yield this.chatService.handleMessage(sessionId, message || "", userData);
                return res.json(response);
            }
            catch (error) {
                console.error("Error in handleChat:", error);
                return res.status(500).json({ error: "Internal Server Error" });
            }
        });
        this.chatService = new ChatService_1.ChatService();
    }
}
exports.ChatController = ChatController;
