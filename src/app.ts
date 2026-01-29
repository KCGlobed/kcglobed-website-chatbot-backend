import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ChatController } from './controllers/ChatController';
import * as dotenv from 'dotenv';
dotenv.config();

export class App {
    public app: Application;
    private chatController: ChatController;

    constructor() {
        this.app = express();
        this.config();

        this.chatController = new ChatController();
        this.routes();
    }

    private config(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    private routes(): void {
        this.app.post('/api/chat', this.chatController.handleChat);
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'UP',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    pid: process.pid
                }
            });
        });
    }
}
