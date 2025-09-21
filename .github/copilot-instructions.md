# Copilot Instructions for AceCore

## Project Architecture
- **Monorepo Structure**: Two main folders: `Backend/` (Node.js/Express) and `Frontend/` (Next.js/React).
- **Backend**:
  - Entry points: `app.js` and `server.js`.
  - Organized by domain: `services/agora/`, `services/user/`, `middlewares/`, `utils/`, `Firebase/`.
  - Follows MVC: `controllers/`, `routes/`, `userServices/`.
  - Uses Firebase and Agora integrations (see `Firebase/` and `services/agora/`).
- **Frontend**:
  - Next.js app with custom config in `next.config.ts`.
  - Uses Tailwind CSS (`tailwind.config.js`, `globals.css`).
  - Components in `src/app/Components/`.
  - Firebase client integration in `lib/firebaseClient.js`.

## Developer Workflows
- **Backend**:
  - Start server: likely `node server.js` or `node app.js` from `Backend/`.
  - Auth handled via middleware (`middlewares/auth.js`).
  - Response helpers in `utils/response.js`.
- **Frontend**:
  - Next.js dev: `npm run dev` in `Frontend/`.
  - Tailwind/PostCSS config files present.

## Conventions & Patterns
- **Backend**:
  - Route/controller/service separation (see `user/routes/userRoutes.js`, `user/controllers/userController.js`, `user/userServices/userService.js`).
  - Middleware for authentication and request handling.
  - External service configs in `config/` folders.
- **Frontend**:
  - Page components in `src/app/` (e.g., `admin/page.jsx`).
  - Shared UI in `src/app/Components/`.
  - Global styles in `globals.css`.
  - Firebase client logic in `lib/firebaseClient.js`.

## Integration Points
- **Firebase**: Used in both backend (`Firebase/firebaseBackend.js`) and frontend (`lib/firebaseClient.js`).
- **Agora**: Backend integration in `services/agora/`.
- **API Communication**: Likely RESTful endpoints exposed from backend routes, consumed by frontend.

## Examples
- To add a new user feature:
  - Backend: Add to `user/controllers/`, `user/routes/`, `user/userServices/`.
  - Frontend: Add UI in `src/app/Components/` and connect via API calls.
- To add a new external service:
  - Create a `config/` and `controllers/` in the relevant service folder.

## Tips for AI Agents
- Respect the domain-driven structure; keep related logic together.
- Use existing middleware and helpers for consistency.
- Reference config files for service integrations.
- Follow Next.js and Tailwind conventions for frontend work.

---
If any section is unclear or missing, please provide feedback for improvement.
