import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { VectorStoreService } from "./VectorStoreService";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config();

export class LangChainService {
    private chatModel: ChatOpenAI;
    private embeddingModel: OpenAIEmbeddings;

    constructor() {
        this.chatModel = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0.7,
        });

        this.embeddingModel = new OpenAIEmbeddings({
            modelName: "text-embedding-3-small",
        });
    }

    async generateResponse(history: any[], userMessage: string): Promise<string> {
        // RAG Implementation
        // 1. Retrieve context
        const vectorStore = new VectorStoreService("kcg-knowledge-base");
        const webVectorStore = new VectorStoreService("kcg-web-content");

        let context = "";
        try {
            const [pdfDocs, webDocs] = await Promise.all([
                vectorStore.similaritySearch(userMessage, 3),
                webVectorStore.similaritySearch(userMessage, 3)
            ]);

            const allDocs = [...pdfDocs, ...webDocs];
            context = allDocs.map(doc => doc.pageContent).join("\n\n");
            console.log("Context found:", allDocs.length);
        } catch (e) {
            console.log("Vector store not ready or connection failed, proceeding without context.");
        }

        const messages = [
            new SystemMessage(`You are KC GlobEd Bot, a helpful assistant for KC Globed. You help with courses, admissions, and LMS support.
            
            Use the following context to answer the user's question. If the answer is not in the context, just say you don't know based on the provided information, or provide general helpful info if appropriate.
            
            Context:
            ${context}
            `),
            ...history.map((msg: any) => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)),
            new HumanMessage(userMessage)
        ];

        const response = await this.chatModel.invoke(messages as any);

        if (typeof response.content === "string") {
            return response.content;
        } else if (Array.isArray(response.content)) {
            return response.content
                .map(part => {
                    if (typeof part === "string") return part;
                    if (part && typeof part === "object" && "text" in part) {
                        return (part as any).text;
                    }
                    return "";
                })
                .join(" ");
        }
        return "";
    }

    async getEmbedding(text: string): Promise<number[]> {
        return await this.embeddingModel.embedQuery(text);
    }
}
