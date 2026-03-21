import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://forgeci_user:forgeci_password@localhost:5432/forgeci?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);

export const prisma = new PrismaClient({ adapter });
