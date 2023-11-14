/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    typecheck: {
        checker: "tsc",
        include: ["src/**/*.test.ts"],
    }    
  },
})