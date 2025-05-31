# Code Analysis Service (CAS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/code-analysis-service/ci.yml?branch=main)](https://github.com/YOUR_USERNAME/code-analysis-service/actions/workflows/ci.yml)
<!-- Add more badges as you set them up, e.g., code coverage, version -->

A powerful, scalable, and extensible microservices-based platform designed to analyze source code for quality, security vulnerabilities, and adherence to best practices across multiple programming languages.

## Overview

The Code Analysis Service (CAS) aims to provide developers and teams with an automated tool to improve code quality and security. Users can submit code via API, a web interface, or a VS Code extension. The system then processes the code through a series of language-specific analyzers and returns a comprehensive report.

## ✨ Features

*   **Multi-Language Support:** Extensible design to support various programming languages (initially Python, Go, JavaScript).
*   **Static Analysis:**
    *   Code Quality & Smells (complexity, duplication, style).
    *   Potential Bug Detection.
*   **Security Scanning (SAST):** Identifies common security vulnerabilities.
*   **Dependency Checking:** (Future) Checks for known vulnerabilities in third-party libraries.
*   **Microservices Architecture:** Scalable, resilient, and independently deployable components.
*   **Multiple Input Methods:**
    *   RESTful API for programmatic access.
    *   User-friendly Web Interface.
    *   Integrated VS Code Extension for in-editor analysis.
*   **Configurable Analysis:** Users can select specific rules or rule sets.
*   **Detailed Reporting:** Clear and actionable feedback on identified issues.
*   **Open Source:** Community-driven and transparent.

## 🏗️ Architecture

CAS utilizes a microservices architecture to ensure scalability and maintainability.

+-----------------------+       +-----------------------+       +-----------------------+
|   VS Code Extension   |------>|      Web Frontend     |<----->|      User / Client    |
+-----------------------+       |(React, TypeScript, UI)|       +-----------------------+
+-----------+-----------+
| (HTTP/S API Calls)
V
+---------------------------------------------------------------------------------------+
|                                    API Gateway                                        |
| (Go - Gin, Authentication, Rate Limiting, Routing, Request Validation)                |
+---------------------------------------------------------------------------------------+
|                                      ^
| (HTTP/S or gRPC)                     | (HTTP/S or gRPC - Results)
V                                      |
+---------------------------------------------------------------------------------------+
|                                Orchestration Service                                  |
| (Go, Manages Analysis Workflow, Dispatches to Analyzers via Message Queue)            |
+---------------------------------------------------------------------------------------+
|                                      ^
| (Publishes Tasks to Queue)           | (Receives Results from Storage/Analyzers)
V                                      |
+---------------------------------------------------------------------------------------+
|                                   Message Queue                                       |
| (RabbitMQ / Kafka - Decouples Services, Asynchronous Processing)                      |
+---------------------------------------------------------------------------------------+
| (Subscribes to Tasks)                ^ (Publishes Analysis Results)
|                                      |
|--------------------->+-----------------------+<----------------------|
|                      | Code Fetcher Service  |                       |
|                      | (Go, Fetches from Git,|                       |
|                      |  uploads, etc.)       |                       |
|                      +-----------------------+                       |
|                                                                      |
+----->[Analyzer Service (Python)] (Go, Wraps Pylint, Bandit, etc.)----+
|                                                                      |
+----->[Analyzer Service (Go)] (Go, Wraps go vet, staticcheck, etc.)---+
|                                                                      |
+----->[Analyzer Service (JS/TS)] (Go, Wraps ESLint, etc.)-------------+
|                                                                      |
| (Other Analyzer Services...)                                         |
|                                                                      |
|                                      +-----------------------+       |
|------------------------------------->| Results Storage Service|<------+
| (Go, PostgreSQL/SQLC, |
|  Stores analysis data) |
+-----------------------+
|
V
+-----------------------+
| Notification Service  |
| (Go, Email, Webhooks) |
+-----------------------+


**Key Components:**

*   **API Gateway:** Single entry point for all client requests.
*   **Orchestration Service:** Manages the analysis workflow.
*   **Analyzer Services:** Language-specific services performing the actual code analysis.
*   **Code Fetcher Service:** Retrieves code from various sources.
*   **Results Storage Service:** Stores analysis configurations and results.
*   **Notification Service:** Notifies users about analysis completion.
*   **Message Queue:** Decouples services for asynchronous processing.
*   **Frontend (Web & VS Code):** User interfaces for interacting with the service.

For more details, see `docs/architecture.md`.

## 🛠️ Tech Stack

**Backend Services (Go):**
*   **Language:** Go
*   **Web Framework:** Gin
*   **Database Interaction:** SQLC + `pgx` (for PostgreSQL)
*   **Message Queue:** `rabbitmq/amqp091-go` (for RabbitMQ)
*   **Configuration:** Viper
*   **Logging:** Zap
*   **Testing:** Testify, Go's built-in testing

**Frontend (Web):**
*   **Framework/Library:** React with TypeScript
*   **Routing:** React Router
*   **State Management:** Zustand (or Redux Toolkit)
*   **UI Components:** Ant Design or Material-UI
*   **HTTP Client:** Axios

**VS Code Extension:**
*   **Language:** TypeScript
*   **Framework:** VS Code API

**Infrastructure:**
*   **Database:** PostgreSQL
*   **Message Queue:** RabbitMQ (or Kafka for higher throughput scenarios)
*   **Containerization:** Docker
*   **Orchestration (Optional but Recommended for Prod):** Kubernetes

**Shared:**
*   **Protocol Buffers (gRPC):** For inter-service communication (optional, can start with REST).

## 🌳 Project Directory Structure

code-analysis-service/
├── .github/             # GitHub Actions workflows (CI/CD)
├── .vscode/             # VS Code specific settings
├── deployments/         # Kubernetes, Docker Swarm configs
├── docs/                # Project documentation (architecture, API, contributing)
├── scripts/             # Helper scripts (build, setup, deploy)
├── services/            # Backend microservices
│   ├── api-gateway/
│   ├── orchestrator/
│   ├── analyzers/       # Parent for language-specific analyzers
│   │   ├── python-analyzer/
│   │   └── ...
│   ├── code-fetcher/
│   ├── results-storage/
│   └── notification/
├── shared/              # Shared code/libraries/protobufs between services
│   ├── go/              # Shared Go packages (models, utils)
│   ├── proto/           # Protobuf definitions for gRPC
│   └── types/           # Shared TypeScript types
├── tools/               # Developer tools (e.g., migration CLI)
├── web/                 # Frontend applications
│   ├── frontend/        # React Web Application
│   └── vscode-extension/ # VS Code Extension
├── .gitignore
├── docker-compose.yml   # For local development environment
├── LICENSE
└── README.md            # This file

Each service under `services/` and `web/` will have its own `README.md` detailing its specific purpose, setup, and API (if applicable).

## 🗺️ Roadmap

This roadmap outlines the planned development phases.

**Phase 1: Foundation & Core (MVP)**
*   [ ] **Setup:** Project structure, Git repo, basic CI.
*   [ ] **Infrastructure:** Docker Compose for PostgreSQL, RabbitMQ.
*   [ ] **API Gateway:** Basic setup (Gin), health check endpoint.
*   [ ] **Orchestrator Service:** Basic workflow logic, listens for API Gateway requests.
*   [ ] **Message Queue Integration:** Orchestrator publishes tasks, Analyzers subscribe.
*   [ ] **Python Analyzer Service (v1):**
    *   Integrate 1-2 basic Python linters (e.g., Pylint for errors, Flake8 for style).
    *   Accepts code snippet/file.
    *   Returns JSON results.
*   [ ] **Results Storage Service:**
    *   PostgreSQL schema for analysis requests and basic results.
    *   SQLC setup.
    *   Endpoint to store results from analyzers.
*   [ ] **End-to-End Flow:** Submit Python code via API Gateway -> Orchestrator -> Python Analyzer -> Store Results -> API Gateway returns basic status/ID.

**Phase 2: Enhancing Analysis & Usability**
*   [ ] **Go Analyzer Service (v1):** Integrate `go vet` and `staticcheck`.
*   [ ] **JavaScript/TS Analyzer Service (v1):** Integrate ESLint.
*   [ ] **Code Fetcher Service:** Implement fetching code from public Git repositories.
*   [ ] **Improved API:** Standardized request/response formats, error handling.
*   [ ] **Web Frontend (v1):**
    *   Basic UI to submit code (text area or file upload).
    *   Display analysis results in a readable format.
    *   User authentication (basic).
*   [ ] **Configuration:** Allow users to specify target language.

**Phase 3: Advanced Features & Polish**
*   [ ] **Security Scanning:** Integrate security-focused tools (e.g., Bandit for Python, Gosec for Go).
*   [ ] **VS Code Extension (v1):**
    *   Submit current file/project for analysis.
    *   Display results as diagnostics within the editor.
*   [ ] **User Accounts & Projects:** Allow users to manage their analysis history and projects.
*   [ ] **Configurable Rules:** Allow users to enable/disable specific rules or categories.
*   [ ] **Notification Service:** Basic email notifications for completed analyses.
*   [ ] **Comprehensive Testing:** Unit, integration, and end-to-end tests for all services.
*   [ ] **Documentation:** Detailed API docs, user guides, contribution guidelines.

**Phase 4: Scalability & Production Readiness**
*   [ ] **Kubernetes Deployment:** Scripts and configurations for deploying to Kubernetes.
*   [ ] **Monitoring & Logging:** Integrate Prometheus/Grafana for metrics, ELK/EFK stack for centralized logging.
*   [ ] **Rate Limiting & Advanced Security:** Implement robust rate limiting, input validation, and security headers.
*   [ ] **Performance Optimization:** Identify and address bottlenecks.
*   [ ] **CI/CD Pipeline:** Fully automated build, test, and deployment pipeline.

**Future Considerations (Post-MVP / Long Term):**
*   [ ] Support for more languages (Java, C#, Ruby, etc.).
*   [ ] Dependency vulnerability scanning.
*   [ ] Custom rule engine/DSL.
*   [ ] AI-powered suggestions.
*   [ ] Team collaboration features.
*   [ ] IDE integrations beyond VS Code.
*   [ ] On-premise deployment options.

## 🚀 Getting Started

**Prerequisites:**
*   Docker & Docker Compose
*   Go (version X.Y.Z)
*   Node.js & npm/yarn (for frontend development)
*   Make (optional, for script automation)

**1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/code-analysis-service.git
cd code-analysis-service

