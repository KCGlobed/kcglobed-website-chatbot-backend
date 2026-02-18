
import { VectorStoreService } from "../services/VectorStoreService";
import * as dotenv from "dotenv";

dotenv.config();

async function verifyIngestion() {
    console.log("Verifying ingestion...");
    const vectorStoreService = new VectorStoreService();

    try {
        const count = await vectorStoreService.getDocumentCount();
        console.log(`Total documents in vector store: ${count}`);

        const queries = ["kcg1", "kcg2", "kcg3"];
        for (const query of queries) {
            console.log(`\nSearching for content related to: ${query}`);
            const results = await vectorStoreService.similaritySearch(query, 3);
            if (results.length > 0) {
                console.log(`Found ${results.length} results.`);
                results.forEach((res, i) => {
                    console.log(`[${i + 1}] Check Source metadata: ${res.metadata.source}`);
                    console.log(`   Content snippet: ${res.pageContent.substring(0, 100)}...`);
                });
            } else {
                console.log("No results found.");
            }
        }

    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verifyIngestion().catch(console.error);
