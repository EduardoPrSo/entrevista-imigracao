import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getDbConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
      port: parseInt(process.env.DB_PORT || ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }
  
  return pool
}

export async function testConnection(): Promise<boolean> {
  try {
    const connection = getDbConnection()
    await connection.query('SELECT 1')
    console.log('✅ Conexão com MySQL estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error)
    return false
  }
}

export interface LoginHistory {
  id: number
  discordId: string
  loginAt: number
}

export interface LoginsByDay {
  date: string
  logins: LoginHistory[]
  count: number
}

export async function getLoginHistory(discordId: string): Promise<{ loginsByDay: LoginsByDay[], totalLogins: number }> {
  try {
    const connection = getDbConnection()
    
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, discordId, loginAt FROM login_history WHERE discordId = ? ORDER BY loginAt DESC',
      [discordId]
    )
    
    const loginsByDay = new Map<string, LoginHistory[]>()
    
    rows.forEach((row) => {
      const login: LoginHistory = {
        id: row.id,
        discordId: row.discordId,
        loginAt: row.loginAt
      }
      
      const date = new Date(login.loginAt * 1000)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!loginsByDay.has(dateKey)) {
        loginsByDay.set(dateKey, [])
      }
      
      loginsByDay.get(dateKey)!.push(login)
    })
    
    const result: LoginsByDay[] = Array.from(loginsByDay.entries())
      .map(([date, logins]) => ({
        date,
        logins,
        count: logins.length
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
    
    return {
      loginsByDay: result,
      totalLogins: rows.length
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de logins:', error)
    throw new Error('Falha ao buscar histórico de logins do banco de dados')
  }
}

export async function getTotalLogins(discordId: string): Promise<number> {
  try {
    const connection = getDbConnection()

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM login_history WHERE discordId = ?',
      [discordId]
    )

    return rows[0]?.total || 0
  } catch (error) {
    console.error('Erro ao contar logins:', error)
    return 0
  }
}

export async function getCreatedAt(discordId: string): Promise<number> {
  try {
    const connection = getDbConnection()

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT created_at FROM accounts WHERE discord = ?',
      [discordId]
    )

    if (!rows[0]) {
      console.log('Nenhum registro encontrado para este Discord ID')
      return 0
    }
    
    let createdAtValue = rows[0].created_at
    
    if (typeof createdAtValue === 'number' && createdAtValue < 100000000000) {
      createdAtValue = createdAtValue * 1000
    }
    
    const createdAt = new Date(createdAtValue)
    const today = new Date()

    const diffMs = today.getTime() - createdAt.getTime()

    const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return daysDiff
  } catch (error) {
    console.error('Erro ao buscar data de criação:', error)
    return 0
  }
}

export async function getBansCount(discordId: string): Promise<number> {
  try {
    const connection = getDbConnection()

    const [accountRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT steam FROM accounts WHERE discord = ?',
      [discordId]
    )

    if (!accountRows[0]) {
      console.log('Nenhuma conta encontrada para este Discord ID')
      return 0
    }

    const steamHex = accountRows[0].steam

    const today = new Date()
    const fortyFiveDaysAgo = new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000)
    const fortyFiveDaysAgoSeconds = Math.floor(fortyFiveDaysAgo.getTime() / 1000)

    const [bansRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM bans_history WHERE steam = ? AND time > ?',
      [steamHex, fortyFiveDaysAgoSeconds]
    )

    return bansRows[0]?.total || 0
  } catch (error) {
    console.error('Erro ao contar bans:', error)
    return 0
  }
}

export async function checkAllowlist(discordId: string): Promise<boolean> {
  try {
    const connection = getDbConnection()

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT allowlist FROM accounts WHERE discord = ?',
      [discordId]
    )

    if (!rows[0]) {
      console.log(`Nenhuma conta encontrada para Discord ID: ${discordId}`)
      return false
    }

    const isAllowed = rows[0].allowlist === 1
    console.log(`Usuário ${discordId} allowlist status: ${isAllowed}`)
    
    return isAllowed
  } catch (error) {
    console.error('Erro ao verificar allowlist:', error)
    return false
  }
}
