
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { VectorStoreService } from "../services/VectorStoreService";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

export async function ingestFiles() {
    console.log("Starting file ingestion...");

    // File paths relative to this script
    const filesToIngest = [
        { path: "../../kcg1.pdf", type: "pdf" },
        { path: "../../kcg2.docx", type: "docx" },
        { path: "../../kcg3.docx", type: "docx" }
    ];

    const vectorStoreService = new VectorStoreService();

    for (const file of filesToIngest) {
        const absolutePath = path.join(__dirname, file.path);
        try {
            let loader;
            if (file.type === "pdf") {
                loader = new PDFLoader(absolutePath);
            } else if (file.type === "docx") {
                loader = new DocxLoader(absolutePath);
            } else {
                console.warn(`Unsupported file type for ${file.path}`);
                continue;
            }

            const docs = await loader.load();
            console.log(`Loaded ${docs.length} document(s) from ${file.path}.`);

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const splitDocs = await splitter.splitDocuments(docs);
            console.log(`Split into ${splitDocs.length} chunks.`);

            // Ensure metadata is serializable for Chroma
            const sanitizedDocs = splitDocs.map(doc => {
                // Add source if missing
                if (!doc.metadata.source) {
                    doc.metadata.source = path.basename(absolutePath);
                }

                // Sanitize metadata values to match VectorStoreService expectations (string, number, boolean)
                const newMetadata: Record<string, any> = {};
                for (const [key, value] of Object.entries(doc.metadata)) {
                    if (value === null || value === undefined) continue;
                    if (typeof value === 'object') {
                        // Chroma doesn't support complex objects in metadata, stringify if needed or skip
                        // For now we'll just skip complex objects unless it's critical
                        // doc.metadata often contains 'pdf' object with info, let's keep simple types
                        continue;
                    }
                    newMetadata[key] = value;
                }
                return { ...doc, metadata: newMetadata };
            });

            await vectorStoreService.addDocuments(sanitizedDocs);
            console.log(`Successfully ingested ${path.basename(absolutePath)}.`);

        } catch (error) {
            console.error(`Error processing ${file.path}:`, error);
        }
    }

    console.log("Ingestion process completed.");
}

// Run the ingestion

// If running directly
if (require.main === module) {
    ingestFiles().catch(console.error);
}

