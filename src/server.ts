import { App } from './app';
import * as dotenv from 'dotenv';
import { ingestDocs } from './scripts/ingest';

import { ingestWeb } from './scripts/ingest-web';

import { ingestFiles } from './scripts/ingest-files';

dotenv.config();

const port = process.env.PORT || 3000;
const app = new App().app;

// Initialize knowledge base then start server
Promise.all([ingestDocs(), ingestWeb(), ingestFiles()]).then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
