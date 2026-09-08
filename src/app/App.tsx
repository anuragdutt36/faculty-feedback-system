import React from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../context/AuthContext.js";
import { PlatformAuthProvider } from "../context/PlatformAuthContext.js";
import { ThemeProvider } from "../context/ThemeContext.js";
import { SettingsProvider } from "../context/SettingsContext.js";
import { AppRouter } from "../routes/AppRouter.js";
import { ErrorBoundary } from "../components/common/ErrorBoundary.js";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PlatformAuthProvider>
          <SettingsProvider>
            <AuthProvider>
              <ThemeProvider>
                <AppRouter />
              </ThemeProvider>
            </AuthProvider>
          </SettingsProvider>
        </PlatformAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
