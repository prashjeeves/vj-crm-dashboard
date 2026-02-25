import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { SnapshotConfig } from './types';

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
    if (dbInstance) return dbInstance;

    // Vercel serverless functions have a read-only filesystem except for /tmp
    const isVercel = process.env.VERCEL === "1";
    const dbPath = isVercel
        ? path.join('/tmp', 'snapshots.sqlite')
        : path.join(process.cwd(), 'snapshots.sqlite');

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      openPipelineValueGbp REAL NOT NULL,
      openOpportunityCount INTEGER NOT NULL,
      createdLast7DaysCount INTEGER NOT NULL,
      createdLast7DaysValue REAL NOT NULL,
      wonLast7DaysCount INTEGER NOT NULL,
      wonLast7DaysValue REAL NOT NULL,
      lostLast7DaysCount INTEGER NOT NULL,
      lostLast7DaysValue REAL NOT NULL,
      createdLast30DaysCount INTEGER NOT NULL,
      createdLast30DaysValue REAL NOT NULL,
      wonLast30DaysCount INTEGER NOT NULL,
      wonLast30DaysValue REAL NOT NULL,
      lostLast30DaysCount INTEGER NOT NULL,
      lostLast30DaysValue REAL NOT NULL,
      createdLast6MonthsCount INTEGER,
      createdLast6MonthsValue REAL,
      wonLast6MonthsCount INTEGER,
      wonLast6MonthsValue REAL,
      lostLast6MonthsCount INTEGER,
      lostLast6MonthsValue REAL,
      createdLast12MonthsCount INTEGER,
      createdLast12MonthsValue REAL,
      wonLast12MonthsCount INTEGER,
      wonLast12MonthsValue REAL,
      lostLast12MonthsCount INTEGER,
      lostLast12MonthsValue REAL,
      byRegionCount TEXT,
      byRegionValue TEXT
    )
  `);

    try {
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN byRegionCount TEXT`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN byRegionValue TEXT`);
    } catch { }

    try {
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN createdLast6MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN createdLast6MonthsValue REAL DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN wonLast6MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN wonLast6MonthsValue REAL DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN lostLast6MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN lostLast6MonthsValue REAL DEFAULT 0`);

        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN createdLast12MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN createdLast12MonthsValue REAL DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN wonLast12MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN wonLast12MonthsValue REAL DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN lostLast12MonthsCount INTEGER DEFAULT 0`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN lostLast12MonthsValue REAL DEFAULT 0`);
    } catch { }

    return dbInstance;
}

export async function saveSnapshot(snapshot: SnapshotConfig): Promise<void> {
    const db = await getDb();
    await db.run(
        `INSERT INTO snapshots (
      timestamp, openPipelineValueGbp, openOpportunityCount,
      createdLast7DaysCount, createdLast7DaysValue,
      wonLast7DaysCount, wonLast7DaysValue,
      lostLast7DaysCount, lostLast7DaysValue,
      createdLast30DaysCount, createdLast30DaysValue,
      wonLast30DaysCount, wonLast30DaysValue,
      lostLast30DaysCount, lostLast30DaysValue,
      createdLast6MonthsCount, createdLast6MonthsValue,
      wonLast6MonthsCount, wonLast6MonthsValue,
      lostLast6MonthsCount, lostLast6MonthsValue,
      createdLast12MonthsCount, createdLast12MonthsValue,
      wonLast12MonthsCount, wonLast12MonthsValue,
      lostLast12MonthsCount, lostLast12MonthsValue,
      byRegionCount, byRegionValue
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            snapshot.timestamp,
            snapshot.openPipelineValueGbp,
            snapshot.openOpportunityCount,
            snapshot.createdLast7DaysCount,
            snapshot.createdLast7DaysValue,
            snapshot.wonLast7DaysCount,
            snapshot.wonLast7DaysValue,
            snapshot.lostLast7DaysCount,
            snapshot.lostLast7DaysValue,
            snapshot.createdLast30DaysCount,
            snapshot.createdLast30DaysValue,
            snapshot.wonLast30DaysCount,
            snapshot.wonLast30DaysValue,
            snapshot.lostLast30DaysCount,
            snapshot.lostLast30DaysValue,
            snapshot.createdLast6MonthsCount,
            snapshot.createdLast6MonthsValue,
            snapshot.wonLast6MonthsCount,
            snapshot.wonLast6MonthsValue,
            snapshot.lostLast6MonthsCount,
            snapshot.lostLast6MonthsValue,
            snapshot.createdLast12MonthsCount,
            snapshot.createdLast12MonthsValue,
            snapshot.wonLast12MonthsCount,
            snapshot.wonLast12MonthsValue,
            snapshot.lostLast12MonthsCount,
            snapshot.lostLast12MonthsValue,
            JSON.stringify(snapshot.byRegionCount || {}),
            JSON.stringify(snapshot.byRegionValue || {})
        ]
    );
}

export async function getLatestSnapshots(limit: number = 2): Promise<SnapshotConfig[]> {
    const db = await getDb();
    const rows = await db.all<{
        timestamp: string; openPipelineValueGbp: number; openOpportunityCount: number;
        createdLast7DaysCount: number; createdLast7DaysValue: number; wonLast7DaysCount: number; wonLast7DaysValue: number;
        lostLast7DaysCount: number; lostLast7DaysValue: number; createdLast30DaysCount: number; createdLast30DaysValue: number;
        wonLast30DaysCount: number; wonLast30DaysValue: number; lostLast30DaysCount: number; lostLast30DaysValue: number;
        createdLast6MonthsCount: number; createdLast6MonthsValue: number; wonLast6MonthsCount: number; wonLast6MonthsValue: number;
        lostLast6MonthsCount: number; lostLast6MonthsValue: number; createdLast12MonthsCount: number; createdLast12MonthsValue: number;
        wonLast12MonthsCount: number; wonLast12MonthsValue: number; lostLast12MonthsCount: number; lostLast12MonthsValue: number;
        byRegionCount?: string; byRegionValue?: string;
    }[]>(`SELECT * FROM snapshots ORDER BY timestamp DESC LIMIT ?`, [limit]);
    return rows.map(r => ({
        ...r,
        createdLast6MonthsCount: r.createdLast6MonthsCount || 0,
        createdLast6MonthsValue: r.createdLast6MonthsValue || 0,
        wonLast6MonthsCount: r.wonLast6MonthsCount || 0,
        wonLast6MonthsValue: r.wonLast6MonthsValue || 0,
        lostLast6MonthsCount: r.lostLast6MonthsCount || 0,
        lostLast6MonthsValue: r.lostLast6MonthsValue || 0,
        createdLast12MonthsCount: r.createdLast12MonthsCount || 0,
        createdLast12MonthsValue: r.createdLast12MonthsValue || 0,
        wonLast12MonthsCount: r.wonLast12MonthsCount || 0,
        wonLast12MonthsValue: r.wonLast12MonthsValue || 0,
        lostLast12MonthsCount: r.lostLast12MonthsCount || 0,
        lostLast12MonthsValue: r.lostLast12MonthsValue || 0,
        byRegionCount: r.byRegionCount ? JSON.parse(r.byRegionCount) : {},
        byRegionValue: r.byRegionValue ? JSON.parse(r.byRegionValue) : {}
    }));
}
