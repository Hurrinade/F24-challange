import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { envConfig } from "@/config/env";
import { ModalProvider } from "@/context/modal/ModalProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "@/App.tsx";
import "@/index.css";

const convex = new ConvexReactClient(envConfig.convexUrl);

const root = createRoot(document.getElementById("root")!);
const queryClient = new QueryClient();

async function startApp() {
  root.render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TooltipProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </TooltipProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ConvexProvider>
    </StrictMode>,
  );
}

startApp();
