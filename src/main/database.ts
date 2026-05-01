import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { Database } from 'node-sqlite3-wasm'
import type { Campaign, CampaignFormData, RPGSystem } from '../types'

let db: Database

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'legionshield.db')

  db = new Database(dbPath)

  createTables()
  runMigrations()
  seedDefaultData()
}

function createTables(): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS rpg_systems (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      banner_url  TEXT DEFAULT '',
      system_id   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (system_id) REFERENCES rpg_systems(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id     INTEGER NOT NULL,
      name            TEXT NOT NULL,
      class_archetype TEXT DEFAULT '',
      notes           TEXT DEFAULT '',
      avatar_url      TEXT DEFAULT '',
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      title       TEXT NOT NULL,
      notes       TEXT DEFAULT '',
      tags        TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_players (
      session_id INTEGER NOT NULL,
      player_id  INTEGER NOT NULL,
      PRIMARY KEY (session_id, player_id),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `)
}

function runMigrations(): void {
  // Check if avatar_url exists in players table
  try {
    db.run('ALTER TABLE players ADD COLUMN avatar_url TEXT DEFAULT ""')
  } catch (err) {
    // Column might already exist, ignore error
  }
}

function seedDefaultData(): void {
  const row = db.get('SELECT COUNT(*) as count FROM rpg_systems') as { count: number }

  if (row.count === 0) {
    const systems = [
      'Genérico',
      'D&D 5e',
      'Pathfinder 2e',
      'Call of Cthulhu',
      'Shadowrun',
      'Giharad',
      'Fate Core',
      'Savage Worlds'
    ]
    for (const name of systems) {
      db.run('INSERT OR IGNORE INTO rpg_systems (name) VALUES (?)', [name])
    }
  }
}

// ─── Campaign Queries ─────────────────────────────────────────────────────────

export function getCampaigns(): Campaign[] {
  return db.all(`
    SELECT c.*, s.name as system_name
    FROM campaigns c
    JOIN rpg_systems s ON c.system_id = s.id
    ORDER BY c.id DESC
  `) as unknown as Campaign[]
}

export function createCampaign(data: CampaignFormData): Campaign {
  db.run(
    `INSERT INTO campaigns (name, description, banner_url, system_id)
     VALUES (?, ?, ?, ?)`,
    [data.name, data.description, data.banner_url, data.system_id]
  )

  const lastId = (db.get('SELECT last_insert_rowid() as id') as { id: number }).id

  return db.get(`
    SELECT c.*, s.name as system_name
    FROM campaigns c
    JOIN rpg_systems s ON c.system_id = s.id
    WHERE c.id = ?
  `, [lastId]) as unknown as Campaign
}

export function updateCampaign(id: number, data: Partial<CampaignFormData>): Campaign {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const sets = entries.map(([k]) => `${k} = ?`).join(', ')
  const values = entries.map(([, v]) => v)

  db.run(`UPDATE campaigns SET ${sets} WHERE id = ?`, [...values, id] as any[])

  return db.get(`
    SELECT c.*, s.name as system_name
    FROM campaigns c
    JOIN rpg_systems s ON c.system_id = s.id
    WHERE c.id = ?
  `, [id]) as unknown as Campaign
}

export function deleteCampaign(id: number): void {
  db.run('DELETE FROM campaigns WHERE id = ?', [id])
}

export function getSystems(): RPGSystem[] {
  return db.all('SELECT * FROM rpg_systems ORDER BY id') as unknown as RPGSystem[]
}

// ─── Player Queries ───────────────────────────────────────────────────────────

export function getPlayersByCampaign(campaignId: number): any[] {
  return db.all(`SELECT * FROM players WHERE campaign_id = ? ORDER BY id DESC`, [campaignId])
}

export function createPlayer(data: any): any {
  db.run(
    `INSERT INTO players (campaign_id, name, class_archetype, notes, avatar_url) VALUES (?, ?, ?, ?, ?)`,
    [data.campaign_id, data.name, data.class_archetype, data.notes, data.avatar_url || '']
  )
  const lastId = (db.get('SELECT last_insert_rowid() as id') as { id: number }).id
  return db.get(`SELECT * FROM players WHERE id = ?`, [lastId])
}

export function updatePlayer(id: number, data: any): any {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const sets = entries.map(([k]) => `${k} = ?`).join(', ')
  const values = entries.map(([, v]) => v)

  db.run(`UPDATE players SET ${sets} WHERE id = ?`, [...values, id] as any[])
  return db.get(`SELECT * FROM players WHERE id = ?`, [id])
}

export function deletePlayer(id: number): void {
  db.run('DELETE FROM players WHERE id = ?', [id])
}

// ─── Session Queries ──────────────────────────────────────────────────────────

export function getSessionsByCampaign(campaignId: number): any[] {
  return db.all(`SELECT * FROM sessions WHERE campaign_id = ? ORDER BY id DESC`, [campaignId])
}

export function createSession(data: any, playerIds: number[]): any {
  db.run(
    `INSERT INTO sessions (campaign_id, title, notes, tags) VALUES (?, ?, ?, ?)`,
    [data.campaign_id, data.title, data.notes, data.tags]
  )
  const lastId = (db.get('SELECT last_insert_rowid() as id') as { id: number }).id

  if (playerIds && playerIds.length > 0) {
    const placeholders = playerIds.map(() => '(?, ?)').join(', ')
    const values = playerIds.flatMap((pid) => [lastId, pid])
    db.run(`INSERT INTO session_players (session_id, player_id) VALUES ${placeholders}`, values)
  }

  return db.get(`SELECT * FROM sessions WHERE id = ?`, [lastId])
}

export function updateSession(id: number, data: any, playerIds: number[]): any {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (entries.length > 0) {
    const sets = entries.map(([k]) => `${k} = ?`).join(', ')
    const values = entries.map(([, v]) => v)
    db.run(`UPDATE sessions SET ${sets} WHERE id = ?`, [...values, id] as any[])
  }

  if (playerIds !== undefined) {
    db.run('DELETE FROM session_players WHERE session_id = ?', [id])
    if (playerIds.length > 0) {
      const placeholders = playerIds.map(() => '(?, ?)').join(', ')
      const values = playerIds.flatMap((pid) => [id, pid])
      db.run(`INSERT INTO session_players (session_id, player_id) VALUES ${placeholders}`, values)
    }
  }

  return db.get(`SELECT * FROM sessions WHERE id = ?`, [id])
}

export function deleteSession(id: number): void {
  db.run('DELETE FROM sessions WHERE id = ?', [id])
}

export function getPresentPlayers(sessionId: number): number[] {
  const rows = db.all('SELECT player_id FROM session_players WHERE session_id = ?', [sessionId]) as { player_id: number }[]
  return rows.map((r) => r.player_id)
}
