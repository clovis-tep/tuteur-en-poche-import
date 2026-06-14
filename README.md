# Tuteur en Poche — Import Excel

Fonctionnalité d'import de contenu pédagogique via fichier Excel pour le dashboard administrateur de Tuteur en Poche.

## Structure du projet

tuteur-en-poche/
├── backend/   → API Node.js / TypeScript / Express / Prisma
└── frontend/  → Interface React / Vite / TypeScript
## Installation

### Backend
cd backend
npm install
npx prisma generate
npm run dev

### Frontend
cd frontend
npm install
npm run dev
## Configuration

Crée un fichier .env dans backend/ :
DATABASE_URL="ta_chaine_neon"

## Utilisation

1. Lance le backend sur http://localhost:3000
2. Lance le frontend sur http://localhost:5173
3. Sélectionne ton fichier Excel (7 feuilles requises)
4. Clique sur Lancer l'import
## Structure du fichier Excel

situations, chapitres, resumes, resume_sections, flashcards, quizzes, quiz_questions

## Endpoint API

POST /api/import/excel — Reçoit un fichier .xlsx, valide et insère en base via transaction Prisma.
