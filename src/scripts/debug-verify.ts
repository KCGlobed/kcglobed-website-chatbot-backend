
import { VectorStoreService } from "../services/VectorStoreService";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const logFile = path.resolve(__dirname, "../../debug-verify.log");
fs.writeFileSync(logFile, "Starting verification...\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
}

async function verifyIngestion() {
    log("Verifying ingestion...");
    log(`CHROMA_HOST: ${process.env.CHROMA_HOST}`);
    log(`CHROMA_PORT: ${process.env.CHROMA_PORT}`);

    const vectorStoreService = new VectorStoreService();

    try {
        log("Getting document count...");
        const count = await vectorStoreService.getDocumentCount();
        log(`Total documents in vector store: ${count}`);

        const queries = ["kcg1", "kcg2", "kcg3", "Hello"];
        for (const query of queries) {
            log(`\nSearching for content related to: ${query}`);
            const results = await vectorStoreService.similaritySearch(query, 3);
            if (results.length > 0) {
                log(`Found ${results.length} results.`);
                results.forEach((res, i) => {
                    log(`[${i + 1}] Source: ${res.metadata.source}`);
                    log(`   Snippet: ${res.pageContent.substring(0, 50)}...`);
                });
            } else {
                log("No results found.");
            }
        }

    } catch (error: any) {
        log("Verification failed (LOG):");
        log(error.toString());
        if (error.stack) log(error.stack);
    }
}

verifyIngestion().catch((err) => {
    log("Unhandled error:");
    log(err.toString());
    if (err.stack) log(err.stack);
});
