# Frontend - Smart Expense Manager

React 18 + TypeScript + Vite + TailwindCSS

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── hooks/          # Custom hooks
├── context/        # React Context
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
└── styles/         # CSS files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## API Integration

The app connects to FastAPI backend at `http://localhost:8000/api/v1`

Configure via `.env` file using `VITE_API_BASE_URL`
