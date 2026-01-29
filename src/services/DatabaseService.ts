import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class DatabaseService {
    private db: Database | null = null;

    constructor() {
        this.init();
    }

    async init() {
        this.db = await open({
            filename: './kcg_bot.db',
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    async saveUser(name: string, phone: string) {
        if (!this.db) await this.init();
        await this.db?.run(
            'INSERT INTO users (name, phone) VALUES (?, ?)',
            name,
            phone
        );
        console.log(`User saved: ${name}, ${phone}`);
    }
}
