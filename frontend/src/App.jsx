import { Route, Routes } from "react-router";
import ProtectedRoute from "./utils/ProtectedRoute";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Authenticate from "./pages/Authenticate";
import { useLocation } from "react-router";
import Dashboard from "./pages/Dashboard";
import GenerateQuiz from "./pages/GenerateQuiz";
import Home from "./pages/Home";
import Arena from "./pages/Arena";
import Standings from "./pages/Standings";
import Profile from "./pages/Profile";
import Host from "./pages/Host";
import Attempt from "./pages/Attempt";

import { ToastContainer, Bounce } from "react-toastify";
import { useTheme } from "./context/ThemeProvider";

const App = () => {
  const location = useLocation();
  const { theme } = useTheme();
  return (
    <>
      {!location.pathname.startsWith("/arena") && <Navbar />}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        transition={Bounce}
      />

      <Routes>
        <Route path="/auth" element={<Authenticate />} />
        <Route path="/" element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<GenerateQuiz />} />
          <Route path="/host" element={<Host />} />
          <Route path="/attempt" element={<Attempt />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/arena/:quizId" element={<Arena />} />
          <Route path="/standings/:quizId" element={<Standings />} />
        </Route>
      </Routes>
      {location.pathname === "/" && <Footer />}
    </>
  );
};

export default App;
