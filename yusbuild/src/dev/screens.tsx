import { BoqDemo } from "./BoqDemo";
import { DashboardDemo } from "./DashboardDemo";
import { ProjectDetailDemo } from "./ProjectDetailDemo";

/** The gallery screens, shared by the route table and the switcher. */
export const SCREENS = [
  { path: "dashboard", label: "Dashboard", element: <DashboardDemo /> },
  { path: "project", label: "Project detail", element: <ProjectDetailDemo /> },
  { path: "boq", label: "BOQ", element: <BoqDemo /> },
];
