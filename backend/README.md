# Backend

Express + TypeScript + PostgreSQL, organized as feature modules.

Each module follows:

```text
routes → controller → service → repository
```

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```
