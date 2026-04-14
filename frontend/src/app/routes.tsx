import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Leaderboard } from "./components/Leaderboard";
import { Register } from "./components/Register";
import { StudentProfile } from "./components/StudentProfile";
import { About } from "./components/About";
import { HeadOn } from "./components/HeadOn";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Leaderboard },
      { path: "register", Component: Register },
      { path: "student/:rollNo", Component: StudentProfile },
      { path: "headon", Component: HeadOn },
      { path: "about", Component: About },
    ],
  },
]);
