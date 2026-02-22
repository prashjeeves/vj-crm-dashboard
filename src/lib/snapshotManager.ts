import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { SnapshotConfig } from './types';

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: path.join(process.cwd(), 'snapshots.sqlite'),
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
      byRegionCount TEXT,
      byRegionValue TEXT
    )
  `);

    try {
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN byRegionCount TEXT`);
        await dbInstance.exec(`ALTER TABLE snapshots ADD COLUMN byRegionValue TEXT`);
    } catch (e) {
        // Columns already exist
    }

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
      byRegionCount, byRegionValue
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            JSON.stringify(snapshot.byRegionCount || {}),
            JSON.stringify(snapshot.byRegionValue || {})
        ]
    );
}

export async function getLatestSnapshots(limit: number = 2): Promise<SnapshotConfig[]> {
    const db = await getDb();
    const rows = await db.all<any[]>(`SELECT * FROM snapshots ORDER BY timestamp DESC LIMIT ?`, [limit]);
    return rows.map(r => ({
        ...r,
        byRegionCount: r.byRegionCount ? JSON.parse(r.byRegionCount) : {},
        byRegionValue: r.byRegionValue ? JSON.parse(r.byRegionValue) : {}
    }));
}
