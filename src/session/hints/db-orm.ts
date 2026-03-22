import type { Detector } from "./context"

/** DB/ORM detected → backend-testing */
export const dbOrm: Detector = (ctx) => {
  const orms: Record<string, string> = {
    "drizzle-orm": "Drizzle",
    "prisma": "Prisma",
    "@prisma/client": "Prisma",
    "typeorm": "TypeORM",
    "sequelize": "Sequelize",
    "knex": "Knex",
    "mongoose": "Mongoose",
    "better-sqlite3": "SQLite",
    "pg": "PostgreSQL (pg)",
    "mysql2": "MySQL",
  }
  const found = Object.entries(orms).filter(([pkg]) => pkg in ctx.deps)
  if (found.length > 0) {
    const names = [...new Set(found.map(([, name]) => name))].join(", ")
    return `This project uses ${names} for database access. When the user asks to test database operations, migrations, or data integrity, use the "backend-testing" skill with patterns appropriate for ${names}.`
  }
}
