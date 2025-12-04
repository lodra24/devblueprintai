# Prism AI - Intelligent Marketing Architect

[![Live Demo](https://img.shields.io/badge/Live-Demo-38bdf8?style=for-the-badge&logo=render&logoColor=white)](https://prismai-8kwe.onrender.com/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**Prism AI** is a full-stack SaaS application that transforms raw product ideas into comprehensive marketing blueprints using Generative AI. It leverages **Laravel 11**, **React**, and **WebSockets** to deliver a real-time, interactive kanban board for marketing angles, user stories, and persona data modeling.

---

## 🚀 Live Demo

**Experience the application live:** [https://prismai-8kwe.onrender.com/](https://prismai-8kwe.onrender.com/)

---

## ✨ What It Does

Prism AI creates a complete **Go-to-Market strategy** from a single prompt. Instead of chatting endlessly with an LLM, users input a business idea, and the system architecturally generates:

-   **Psychological Angles (Epics):** Deconstructs the product value into distinct marketing angles (e.g., "Fear of Missing Out," "Status/Ego," "Logical Utility").
-   **Asset Packs (User Stories):** Generates concrete copy assets for each angle, including **Google Ads Headlines**, **Email Subject Lines**, **Landing Page Hooks**, and **CTAs**.
-   **Interactive Kanban Board:** A Trello-like interface where users can drag-and-drop assets to prioritize their marketing backlog.
-   **Persona Data Modeling:** Automatically infers and structures the target audience's demographics, pain points, and motivations into a database schema format.
-   **Variation Comparison:** A dedicated "Reader Mode" to compare different copy variations side-by-side for A/B test planning.
-   **CSV Export:** One-click export of the entire blueprint to integrate with external project management tools.

## 🏗 System Architecture & Key Features

This project was architected with scalability, maintainability, and user experience in mind. It moves beyond standard CRUD operations to handle complex asynchronous tasks and real-time state management.

### 🧠 Backend (Laravel 11)

-   **Service-Action Pattern:** Business logic is decoupled from controllers. Actions like `SyncEpicsAction` and `SanitiseBlueprintDataAction` ensure code reusability and testability.
-   **Polymorphic AI Provider Layer:** An abstracted `AiProviderInterface` allows seamless switching between **Google Gemini** and **OpenAI**. The system is agnostic to the underlying LLM.
-   **Robust Parsing Logic:** Custom regex-based parsers (`BlueprintMarkdownParser`) sanitize and structure non-deterministic AI outputs into relational database records.
-   **Real-Time Broadcasting:** Utilizing **Laravel Reverb**, the backend broadcasts status updates (`generating`, `parsing`, `ready`) to the frontend instantly via private channels.
-   **Job Queues:** Heavy AI processing is offloaded to Redis queues (`GenerateBlueprintJob`) to prevent request timeouts and ensure a responsive UI.

### 🎨 Frontend (React + TypeScript)

-   **Optimistic UI:** Powered by **TanStack Query**, the UI updates instantly during interactions (like drag-and-drop reordering via `@dnd-kit`), syncing with the server in the background.
-   **Type Safety:** Fully typed interfaces (`Project.ts`, `Epic.ts`) ensure contract parity between the Laravel backend resource collections and the React frontend.
-   **Dynamic Components:** Reusable UI components (Glassmorphism cards, floating inputs) built with **Tailwind CSS**.

---

## 🛠 Tech Stack

-   **Backend:** PHP 8.2, Laravel 11, PostgreSQL, Redis (Queue & Cache).
-   **Frontend:** React 18, TypeScript, Vite, TanStack Query, DnD Kit.
-   **Real-time:** Laravel Reverb (WebSockets), Laravel Echo.
-   **AI Integration:** Google Gemini / OpenAI API via Guzzle.
-   **DevOps:** Docker (Custom `Dockerfile` & `entrypoint.sh`), Supervisord, Nginx.
-   **Testing:** PHPUnit (Feature/Unit), Vitest.

---

## ⚡ Deployment

The application is containerized for production consistency.

1.  **Dockerization:** A custom `Dockerfile` sets up PHP 8.2-FPM, Nginx, and system dependencies.
2.  **Process Management:** `supervisord` manages the Nginx web server, PHP-FPM, the Laravel Queue Worker, and the Reverb WebSocket server simultaneously within the container.
3.  **Entrypoint:** An automated entrypoint script handles database migrations and caching upon container startup.

---

## 🧪 Testing

The project maintains high code quality through automated testing.

### Backend Tests

Runs unit tests for parsers and feature tests for API endpoints.

```bash
php artisan test
```

### Frontend Tests

Runs component interaction tests using Vitest and React Testing Library.

```bash
npm run test
```

---

## 💻 Local Development Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/prismai.git
    cd prismai
    ```

2.  **Environment Setup**

    ```bash
    cp .env.example .env
    # Configure DB_CONNECTION, REDIS_URL, and AI_API_KEYS in .env
    ```

3.  **Install Dependencies**

    ```bash
    composer install
    npm install
    ```

4.  **Database & Migrations**

    ```bash
    php artisan migrate --seed
    ```

5.  **Run Application**
    ```bash
    npm run dev
    php artisan serve
    php artisan reverb:start # For WebSockets
    php artisan queue:work   # For AI Jobs
    ```

---

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
