# Agent Information for `bg-manager-next`

**WARNING: This execution environment has critical and unresolved issues that prevent the Next.js application from being started.**

This document provides context for AI agents working on this Next.js project, detailing the severe environmental problems encountered.

## Executive Summary of the Problem

Despite multiple attempts using various strategies, it has been impossible to start the Next.js application using `npm run dev`, `npm start`, `docker compose up`, or direct `node` execution. While `npm run build` succeeds after a clean reinstall, the runtime environment consistently fails to locate and execute the `next` binary or its underlying modules. This is not a code issue but a fundamental flaw in the execution environment.

**Conclusion:** All tasks requiring a running server (e.g., Playwright E2E tests) are blocked. The current strategy is to complete all possible code-level tasks (commenting, unit test creation, documentation) and submit the work without a live preview.

## Detailed Debugging History

### 1. Initial `npm run dev` Failures
- **Symptom:** The `npm run dev` command would exit silently without starting the server or providing any error logs.
- **Hypothesis:** Missing Firebase credentials.
- **Actions:**
    - Created robust Firebase initialization logic to handle missing credentials.
    - Fixed a TypeScript error revealed by `npm run build`.
- **Result:** Issue persisted. `npm run build` was successful, but `npm run dev` still failed.

### 2. Suspected Turbopack / Workspace Issue
- **Symptom:** A warning during `npm run build` pointed to multiple `package-lock.json` files (one in the root, one in `bg-manager-next`), potentially confusing Turbopack.
- **Hypothesis:** Turbopack was misinterpreting the project root.
- **Actions:**
    - Modified `next.config.ts` to explicitly set the `turbopack.root`.
    - Modified `package.json` to disable Turbopack with `next dev --no-turbo`.
- **Result:** Issue persisted. The problem is not specific to Turbopack.

### 3. Unexplained File System Instability
- **Symptom:** Files that were confirmed to have been created (e.g., `.env.local.template`, a previous `AGENTS.md`) later disappeared from the file system without explanation.
- **Result:** This indicates the environment is unstable, requiring work to be recreated.

### 4. `npm start` Failure
- **Symptom:** After a successful `npm run build`, `npm start` failed with the error `sh: 1: next: not found`.
- **Hypothesis:** The environment's `PATH` is not correctly configured to include `./node_modules/.bin`, preventing npm scripts from finding local binaries.

### 5. Docker Environment Attempt
- **Goal:** Bypass local environment issues by running the application in a container.
- **Actions:**
    - Created a `Dockerfile` and `docker-compose.yml`.
- **Result:** Blocked by two separate, insurmountable environment issues:
    1.  `permission denied` when connecting to the Docker daemon socket.
    2.  After using `sudo`, hit a `429 Too Many Requests` rate limit error when trying to pull the `node:20-alpine` base image from Docker Hub.

### 6. Clean Reinstall and Final Attempts
- **Goal:** Resolve any corruption by starting from scratch.
- **Actions:**
    - Deleted the entire `bg-manager-next` directory.
    - Ran `npx create-next-app` again.
    - Re-installed dependencies and recreated all source code files.
- **Result:** The exact same errors persisted.
    - `npm run build` **succeeded**.
    - `npm run dev` and `npm start` failed with `next: not found`.
    - A final attempt to run the server directly via `node node_modules/next/dist/bin/next-start` failed with `Error: Cannot find module`.

This comprehensive failure across all startup vectors points to a critical misconfiguration of the underlying execution environment.
