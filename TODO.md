# Project SteelCode: TODO & Development Plan

**Current Date:** 2025-05-30

## 1. Core Vision & Goals

- [ ] **Define Mission Statement:** To empower developers to write higher-quality, more secure, and more maintainable code faster.
- [ ] **Identify Core Analyses (Initial Focus - MVP):**
  - [ ] Security Vulnerabilities (e.g., hardcoded secrets for chosen MVP language)
  - [ ] Bug Detection (e.g., unused variables for chosen MVP language)
  - [ ] Bad Patterns (e.g., overly complex functions - basic cyclomatic complexity for chosen MVP language)
- [ ] **Identify Target Users:** Individual developers, small to medium-sized development teams.
- [ ] **List Key Differentiators (Aspirational):** Ease of use, speed, actionable insights, extensibility.

## 2. Architectural Decisions & Principles

- [ ] **Overall Architecture:** Client-Server Model.
  - Backend: Go
  - Frontend: React
- [ ] **Backend Architecture:** Modular Monolith.
  - [ ] Apply Hexagonal Architecture (Ports and Adapters) principles for the core analysis engine.
- [ ] **Frontend Architecture:** Component-Based.
- [ ] **Communication Protocol:**
  - [ ] **Primary:** RESTful API with JSON payloads (for Frontend-Backend).
  - [ ] **Consideration for future/specific uses:** gRPC (for CLI, potential streaming, future internal services).
- [ ] **Development Methodology:**
  - [ ] Agile (Kanban initially, potentially Scrum later).
  - [ ] Test-Driven Development (TDD) - **CRITICAL** for rule engine and core logic.
  - [ ] Domain-Driven Design (DDD) - Apply core principles (Ubiquitous Language, Bounded Contexts).
- [ ] **Key Principles to Uphold:**
  - [ ] Testability
  - [ ] Maintainability & Readability
  - [ ] User Experience (UX) - Clear, actionable results.
  - [ ] Security (of SteelCode itself, especially with code uploads).
  - [ ] Extensibility (for new languages, new rules).

## 3. Technology Stack & Libraries

- [ ] **Backend (Go):**
  - [ ] Core: Go Standard Library (`net/http`, `encoding/json`, `os`, `io`, `go/parser`, `go/ast`, `go/scanner`, `go/types` for Go analysis).
  - [ ] HTTP Router: `chi` or `gorilla/mux` (Decide: ________).
  - [ ] Database (Optional for MVP, consider for user accounts/projects later): SQLite (`github.com/mattn/go-sqlite3`) or PostgreSQL (`github.com/lib/pq` + `sqlx`).
  - [ ] Configuration: `github.com/spf13/viper`.
  - [ ] Logging: `github.com/sirupsen/logrus` or `go.uber.org/zap` (Decide: ________).
  - [ ] Testing: Go `testing` package, `github.com/stretchr/testify`.
  - [ ] Linters/Formatters: `golangci-lint`, `gofmt`.
  - [ ] (If gRPC used) Protobufs: `google.golang.org/protobuf`, `google.golang.org/grpc`.
- [ ] **Frontend (React):**
  - [ ] Build Tool/Bundler: **Rsbuild** (User specified).
  - [ ] Core: React.
  - [ ] Routing: `@tanstack/react-router`.
  - [ ] Data Fetching/Server State: `@tanstack/react-query`.
  - [ ] UI Styling: **Tailwind CSS**.
  - [ ] UI Components (Optional, consider if Tailwind alone is not enough): Headless UI, Radix UI, or a component library like Shadcn/ui (compatible with Tailwind).
  - [ ] Forms: React Hook Form or Formik (Decide: ________).
  - [ ] Code Display/Editor: Monaco Editor or CodeMirror (Decide: ________ - Monaco recommended for VS Code feel).
  - [ ] Testing: Jest, React Testing Library. E2E: Playwright or Cypress.
  - [ ] Linters/Formatters: ESLint, Prettier.
- [ ] **Common Tools:**
  - [ ] Version Control: Git, GitHub/GitLab.
  - [ ] Containerization: Docker, Docker Compose.
  - [ ] CI/CD: GitHub Actions (or similar).

## 4. Project Structure

- [ ] **Setup Monorepo (Optional but Recommended):** e.g., using `pnpm workspaces` if frontend and backend are in the same repo, or just separate top-level folders.

    ```
    steelcode/
    ├── backend/      # Go application
    │   ├── cmd/steelcode-server/main.go
    │   ├── internal/ (api, analysis, config, store, etc.)
    │   ├── pkg/ (optional public libs)
    │   ├── go.mod, go.sum, Dockerfile, Makefile
    ├── frontend/     # React application (Rsbuild)
    │   ├── src/ (components, features, pages, etc.)
    │   ├── rsbuild.config.ts, package.json, tsconfig.json, Dockerfile
    ├── .gitignore
    ├── docker-compose.yml (optional)
    └── README.md
    └── TODO.md (this file!)
    ```

- [ ] **Backend Internal Structure:** Follow guidelines for modularity (api, analysis, rules, config, store).
- [ ] **Frontend Internal Structure:** Organize by features, components, pages, services/hooks.

## 5. Phased Development Plan & Tasks

### Phase 0: Setup & Foundational Prototyping (1-2 Sprints)

- **Project Setup:**
  - [ ] Initialize Git repository.
  - [ ] Setup Go backend project: `go mod init steelcode/backend`.
  - [ ] Setup React frontend project with Rsbuild and Tailwind CSS.
  - [ ] Configure linters & formatters for both backend and frontend.
  - [ ] Setup basic Dockerfile for backend.
  - [ ] Setup basic Dockerfile for frontend.
  - [ ] (Optional) Setup `docker-compose.yml` for local development.
- **Backend Prototyping:**
  - [ ] Create a basic HTTP server in Go (e.g., a single health check endpoint).
  - [ ] **Choose MVP Language for Analysis:** (Decide: ________ - e.g., Go itself, JavaScript).
  - [ ] Prototype parsing a simple code snippet of the MVP language (e.g., using `go/parser` if Go is chosen).
  - [ ] Prototype a single, very simple analysis rule (e.g., "detect function named 'foo'").
  - [ ] Log rule findings to console.
- **Frontend Prototyping:**
  - [ ] Setup basic routing with Tanstack Router (e.g., a home page, an analysis page).
  - [ ] Create a simple file input component.
  - [ ] Make a dummy API call from frontend to backend health check.
- **API Definition:**
  - [ ] Define initial V1 REST API contract for code submission and receiving results (e.g., OpenAPI/Swagger draft).

### Phase 1: Core Analysis Engine & CLI (Backend Focus - TDD Heavy)

- **Language Parsing:**
  - [ ] Implement robust parsing for the chosen MVP language.
  - [ ] Develop AST traversal logic (`ast.Inspect` for Go, or equivalent).
- **Rule Engine Development:**
  - [ ] Define `Rule` interface and `Issue` struct in Go.
  - [ ] Implement a rule registry.
  - [ ] Implement the core `ast.Inspect` based rule execution loop.
- **MVP Rule Implementation (TDD for each rule):**
  - [ ] Implement 3-5 critical rules for the MVP language (Security, Bugs, Patterns).
    - [ ] Rule 1: (Define: ________)
    - [ ] Rule 2: (Define: ________)
    - [ ] Rule 3: (Define: ________)
  - [ ] Create test fixtures (sample code files with expected issues/no issues) for each rule.
- **CLI Development:**
  - [ ] Create a simple CLI application (e.g., using `cobra` or `spf13/pflag`) that:
    - [ ] Takes a file path as input.
    - [ ] Runs the analysis engine.
    - [ ] Outputs results as JSON to stdout.
- **Backend API - Initial Implementation:**
  - [ ] Implement API endpoint to accept a single code file (or text input).
  - [ ] Implement API endpoint to return analysis results (JSON).
  - [ ] Basic error handling and validation.

### Phase 2: Basic API & Frontend Integration (MVP Release)

- **Frontend Development:**
  - [ ] Develop UI for code input (file upload, text area).
  - [ ] Integrate Tanstack Query to call backend analysis API.
  - [ ] Display analysis results in a clear, readable list.
  - [ ] Implement basic code display (using chosen editor: Monaco/CodeMirror).
  - [ ] **Highlighting:** Implement basic issue highlighting in the code display based on line/column from results.
  - [ ] Basic styling with Tailwind CSS.
  - [ ] User-friendly loading states and error messages.
- **API Refinement:**
  - [ ] Refine API based on frontend needs.
  - [ ] Add necessary request validation.
- **Testing:**
  - [ ] Backend: Unit and Integration tests for API endpoints and engine.
  - [ ] Frontend: Component tests, basic E2E test for upload & display.
- **Deployment (MVP):**
  - [ ] Prepare for a simple deployment (e.g., Docker containers on a cloud service or local).

### Phase 3: Feature Expansion & Polish (Post-MVP)

- [ ] **Language Support:**
  - [ ] Add support for a second language (research parsers, define rules).
- [ ] **Rule Expansion:**
  - [ ] Add more rules for existing languages.
  - [ ] Categorize rules more effectively.
- [ ] **User Experience (UX) Improvements:**
  - [ ] Advanced result filtering/sorting.
  - [ ] More detailed issue explanations and remediation advice.
  - [ ] UI/UX polish based on feedback.
- [ ] **Configuration:**
  - [ ] Allow users to enable/disable rules (backend + frontend UI).
  - [ ] Allow users to configure rule severity (backend + frontend UI).
- [ ] **Code Duplication Analysis:**
  - [ ] Research and implement a basic code duplication detection algorithm.
- [ ] **Persistence (If not in MVP):**
  - [ ] User accounts.
  - [ ] Saving analysis projects/results.
  - [ ] Storing rule configurations per user/project.

### Phase 4: Advanced Features & Integrations (Long Term)

- [ ] **IDE Integrations:**
  - [ ] VS Code Extension.
- [ ] **CI/CD Integration:**
  - [ ] GitHub Action / GitLab CI component.
  - [ ] SARIF output format support.
- [ ] **Advanced Analysis:**
  - [ ] Performance hotspot suggestions.
  - [ ] Maintainability metrics (cyclomatic complexity, Halstead, etc.).
  - [ ] Data flow analysis for more complex bugs/security issues.
- [ ] **Custom Rule Editor UI:**
  - [ ] Allow users to define their own rules through the UI (complex).
- [ ] **Team Features:**
  - [ ] Shared configurations, dashboards.
- [ ] **Performance Optimization:**
  - [ ] Profile and optimize analysis engine for large codebases.
  - [ ] Consider gRPC streaming for results if beneficial.

## 6. Open Questions & Decisions to Make

- [ ] **MVP Language for Analysis:** _________________
- [ ] **Backend HTTP Router:** `chi` vs `gorilla/mux`?
- [ ] **Backend Logger:** `logrus` vs `zap`?
- [ ] **Frontend Forms Library:** React Hook Form vs Formik?
- [ ] **Frontend Code Editor:** Monaco vs CodeMirror? (Monaco leaning)
- [ ] **Specific MVP Rules:** Define the exact 3-5 rules for Phase 1.
- [ ] **Database Choice (if/when needed):** SQLite vs PostgreSQL?
- [ ] **Monorepo Tooling (if adopted):** pnpm workspaces, Nx, Turborepo?

## 7. Documentation

- [ ] **README.md:** Project overview, setup, how to run.
- [ ] **API Documentation:** (e.g., OpenAPI/Swagger).
- [ ] **Rule Documentation:** Explain what each rule checks for.
- [ ] **Architecture Document (High-Level):** Summarize key decisions.

---

This `TODO.md` should give you a solid roadmap. Remember to break down these larger tasks into smaller, manageable tickets or items as you start each phase. Good luck with SteelCode!
