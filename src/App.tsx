import { Routes, Route, Outlet } from "react-router";
import { ThemeToggle } from "@/components";
import Home from "@/pages/authenticated/home/Home";
import Settings from "@/pages/authenticated/settings/Settings";
import Root from "@/pages/Root";
import Public from "@/pages/unauthenticated/public/Public";

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
          <Route element={<Outlet />}>
            <Route path="/home" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
