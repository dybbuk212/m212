import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router";
import "../styles/globals.css";
import { ThemeProvider } from "../design-system/themes/ThemeProvider";

const router = createAppRouter();
const el = document.getElementById("root");
if (!el) throw new Error("Root element #root missing");
createRoot(el).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
