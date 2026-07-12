import { Route, Routes } from "react-router";
import Root from "@/pages/Root";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
    </Routes>
  );
}

export default App;
