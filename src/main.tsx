import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { installPreloadErrorHandler } from "./lib/lazyRoute";

installPreloadErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
