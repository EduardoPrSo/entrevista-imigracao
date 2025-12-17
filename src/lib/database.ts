import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getDbConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'discord_bot',
      port: parseInt(process.env.DB_PORT || '3306'),
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
    
    // Agrupar logins por dia
    const loginsByDay = new Map<string, LoginHistory[]>()
    
    rows.forEach((row) => {
      const login: LoginHistory = {
        id: row.id,
        discordId: row.discordId,
        loginAt: row.loginAt
      }
      
      // Converter timestamp Unix para data
      const date = new Date(login.loginAt * 1000)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!loginsByDay.has(dateKey)) {
        loginsByDay.set(dateKey, [])
      }
      
      loginsByDay.get(dateKey)!.push(login)
    })
    
    // Converter Map para array ordenado
    const result: LoginsByDay[] = Array.from(loginsByDay.entries())
      .map(([date, logins]) => ({
        date,
        logins,
        count: logins.length
      }))
      .sort((a, b) => b.date.localeCompare(a.date)) // Ordenar por data decrescente
    
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
