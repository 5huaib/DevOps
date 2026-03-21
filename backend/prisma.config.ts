import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: "postgresql://forgeci_user:forgeci_password@localhost:5432/forgeci?schema=public"
  }
})
