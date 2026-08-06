import React from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../context/AuthContext.js";
import { ThemeProvider } from "../context/ThemeContext.js";
import { SettingsProvider } from "../context/SettingsContext.js";
import { AppRouter } from "../routes/AppRouter.js";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppRouter />
          </ThemeProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
};

export default App;
