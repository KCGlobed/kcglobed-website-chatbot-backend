"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.LangChainService = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class LangChainService {
    constructor() {
        this.chatModel = new openai_1.ChatOpenAI({
            modelName: "gpt-3.5-turbo", // Cost effective for general chat, can be 4o
            temperature: 0.7,
        });
        this.embeddingModel = new openai_1.OpenAIEmbeddings({
            modelName: "text-embedding-3-small",
        });
    }
    generateResponse(history, userMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            // Convert custom history object to LangChain messages if needed, 
            // but for now simpler is just to pass context in prompt or use history array.
            // Simplified usage:
            const messages = [
                new messages_1.SystemMessage("You are KC GlobEd Bot, a helpful assistant for KC Globed. You help with courses, admissions, and LMS support."),
                ...history.map(msg => msg.role === 'user' ? new messages_1.HumanMessage(msg.content) : new messages_1.AIMessage(msg.content)),
                new messages_1.HumanMessage(userMessage)
            ];
            const response = yield this.chatModel.invoke(messages);
            // Handle response content correctly
            if (typeof response.content === "string") {
                return response.content;
            }
            else if (Array.isArray(response.content)) {
                // If the content is an array (e.g. from multimodal inputs), join it into a single string.
                return response.content
                    .map(part => {
                    if (typeof part === "string")
                        return part;
                    // Check if 'text' property exists on the object
                    if (part && typeof part === "object" && "text" in part) {
                        return part.text;
                    }
                    return "";
                })
                    .join(" ");
            }
            return "";
        });
    }
    getEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.embeddingModel.embedQuery(text);
        });
    }
}
exports.LangChainService = LangChainService;
