import { Routes, Route, Navigate, Outlet } from "react-router";
import { ThemeToggle } from "@/components";
import Home from "@/pages/authenticated/home/Home";
import Settings from "@/pages/authenticated/settings/Settings";
import Root from "@/pages/Root";
import Public from "@/pages/unauthenticated/public/Public";
import { AuthLoading, useConvexAuth } from "convex/react";

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <div className="h-svh flex flex-col overflow-hidden">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <main className="min-w-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/public" element={<Public />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
      <AuthLoading>
        <p>Still loading</p>
      </AuthLoading>
    </div>
  );
}

export default App;
