# Angular to Next.js Migration Plan

This document outlines the strategy and step-by-step plan for re-architecting the HARIDICE application from Angular to Next.js and React.

## 1. Basic Policy

-   The migration will respect the existing design philosophy, especially the deep integration with Firebase, while rebuilding the frontend according to React/Next.js best practices.
-   The UI will be reimplemented using **MUI (Material-UI)**, a popular React UI library, to maintain a consistent look and feel with the original Angular Material design.
-   The data flow and state management architecture will be transitioned from Angular's Service-based model to one centered around **React Hooks and the Context API**.

## 2. Technology Stack Selection

-   **Framework**: Next.js (latest stable version, with App Router)
-   **UI Library**: MUI (Material-UI)
-   **State Management**:
    -   Global state (e.g., authentication): React Context API
    -   Local UI state: `useState`, `useReducer`
    -   Server state & data fetching: Custom Hooks wrapping the Firebase SDK's real-time listeners. Initially, we will not introduce additional libraries like SWR or React Query to keep the stack lean.
-   **Forms**: React Hook Form
-   **Styling**: SCSS Modules, leveraging the existing `styles.scss`.

## 3. New Architecture Design

### 3.1. Directory Structure

The project will follow the standard directory structure for the Next.js App Router.

```
/
|-- /app            # Pages, layouts, and UI components for routes
|   |-- /_components # Private components for pages (e.g., dialogs)
|   |-- layout.tsx
|   `-- page.tsx
|-- /components     # Reusable, shared UI components (e.g., buttons, inputs)
|-- /contexts       # React Context providers (e.g., AuthContext)
|-- /hooks          # Custom Hooks for business logic and data fetching
|   |-- useAuth.ts
|   `-- useBoardgames.ts
|-- /lib            # Library code, utility functions
|   `-- /firebase   # Firebase SDK initialization and configuration
`-- /types          # TypeScript type definitions
```

### 3.2. Logic Migration Strategy

-   **`AuthService`**: Its responsibilities will be replaced by an `AuthContext` to provide global authentication state (`user`, `isAdmin`) and a `useAuth` hook to provide functions like `login` and `logout`.
-   **`BoardgameService`**: The logic for communicating with Firestore and joining data collections will be encapsulated within a `useBoardgames` custom hook. This hook will return the list of board games combined with user-specific data, ready for rendering.

### 3.3. Component Re-implementation

-   **`AppComponent` (Header/Toolbar)**: Will be reimplemented as a common layout component within `/app/layout.tsx`.
-   **`ListComponent` (Main Page)**: Will be the main page component at `/app/page.tsx`.
-   **Dialog Components**: Each dialog will be rebuilt as a separate React component using MUI's `Dialog` component, with its open/close state managed by the parent page component.

## 4. Step-by-Step Migration Plan

1.  **Environment Setup**: Create a new Next.js project and install the necessary dependencies (MUI, Firebase SDK, React Hook Form, SCSS). Configure Firebase credentials.
2.  **Authentication**: Implement the core authentication flow. Create the `AuthContext` and `useAuth` hook to handle Google login/logout and provide user information globally.
3.  **Read-Only Data Display**: Develop the `useBoardgames` hook to fetch and combine data from the `boardGames` and `userBoardGames` collections. Implement the main list view to display the games in a read-only fashion.
4.  **Data Update Functionality**: Re-implement the dialog components one by one to handle data mutations (e.g., editing user evaluations, adding/editing board games for admins).
5.  **Implement Remaining Features**: Re-implement auxiliary features such as the "Bodoge Gacha".
6.  **Final Touches & CI/CD**: Ensure all features are working, refine styles, and configure GitHub Actions for automated deployment to Firebase Hosting.
