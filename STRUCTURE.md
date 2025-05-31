steelcode/
├── backend/  # Go Application
│   ├── cmd/
│   │   └── steelcode-server/ # Main application entry point
│   │       └── main.go
│   ├── internal/
│   │   ├── api/              # HTTP handlers, routing, request/response models
│   │   │   ├── handlers.go
│   │   │   ├── router.go
│   │   │   └── middleware.go
│   │   ├── analysis/         # Core analysis engine
│   │   │   ├── engine.go       # Orchestrates analysis
│   │   │   ├── parser.go       # Language-agnostic parsing interface, specific parsers
│   │   │   ├── ast_utils.go    # Helper functions for working with ASTs
│   │   │   ├── rules/          # Rule definitions and implementations
│   │   │   │   ├── go/           # Go-specific rules
│   │   │   │   │   ├── empty_if_rule.go
│   │   │   │   │   └── ...
│   │   │   │   ├── javascript/   # JavaScript-specific rules (if you add JS support)
│   │   │   │   │   └── ...
│   │   │   │   ├── rule.go       # Rule interface, common issue struct
│   │   │   │   └── registry.go   # Rule registration
│   │   │   └── types.go        # Common types for analysis (Issue, Severity, etc.)
│   │   ├── config/           # Configuration loading and management
│   │   │   └── config.go
│   │   ├── project/          # Handling code input (files, git repos)
│   │   │   └── loader.go
│   │   ├── store/            # (Optional) Database interaction / persistence
│   │   │   ├── db.go
│   │   │   └── user_store.go
│   │   └── utils/            # Common utility functions
│   ├── pkg/                # Public libraries (if you plan to make parts reusable - less common for internal tools)
│   │   └── logger/
│   ├── go.mod
│   ├── go.sum
│   ├── Dockerfile          # For containerizing the backend
│   └── Makefile            # For build, test, lint commands
│
├── frontend/ # React Application (e.g., using Vite)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/           # Static assets like images, fonts
│   │   ├── components/       # Reusable UI components
│   │   │   ├── CodeEditor/
│   │   │   │   └── CodeEditor.tsx
│   │   │   ├── IssueList/
│   │   │   │   └── IssueList.tsx
│   │   │   └── common/         # Buttons, Modals, etc.
│   │   ├── features/         # Feature-specific components and logic
│   │   │   ├── analysis/
│   │   │   │   ├── AnalysisPage.tsx
│   │   │   │   ├── analysisApi.ts  # Tanstack Query hooks for analysis
│   │   │   │   └── types.ts        # Types related to analysis results
│   │   │   └── projectUpload/
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Page layout components (e.g., MainLayout)
│   │   ├── lib/              # Tanstack Query client, other libs setup
│   │   ├── pages/            # Top-level page components (routed by Tanstack Router)
│   │   ├── services/         # API service wrappers (could be part of features/xxxApi.ts)
│   │   ├── store/            # Global state (e.g., Zustand, if not solely relying on Tanstack Query)
│   │   ├── styles/           # Global styles, theme
│   │   ├── App.tsx           # Main App component with router setup
│   │   ├── main.tsx          # Entry point for React
│   │   └── vite-env.d.ts
│   ├── .eslintrc.cjs
│   ├── .prettierrc.json
│   ├── index.html          # Entry HTML (if not in public/)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile          # For containerizing the frontend
│
├── .gitignore
├── docker-compose.yml    # (Optional) For running backend and frontend together
└── README.md

