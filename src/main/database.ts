import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { Database } from 'node-sqlite3-wasm'
import type { Campaign, CampaignFormData, RPGSystem } from '../../types'

let db: Database

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'legionshield.db')

  db = new Database(dbPath)

  createTables()
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
      FOREIGN KEY (system_id) REFERENCES rpg_systems(id)
    );
  `)
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
  `) as Campaign[]
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
  `, [lastId]) as Campaign
}

export function updateCampaign(id: number, data: Partial<CampaignFormData>): Campaign {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const sets = entries.map(([k]) => `${k} = ?`).join(', ')
  const values = entries.map(([, v]) => v)

  db.run(`UPDATE campaigns SET ${sets} WHERE id = ?`, [...values, id])

  return db.get(`
    SELECT c.*, s.name as system_name
    FROM campaigns c
    JOIN rpg_systems s ON c.system_id = s.id
    WHERE c.id = ?
  `, [id]) as Campaign
}

export function deleteCampaign(id: number): void {
  db.run('DELETE FROM campaigns WHERE id = ?', [id])
}

export function getSystems(): RPGSystem[] {
  return db.all('SELECT * FROM rpg_systems ORDER BY id') as RPGSystem[]
}
