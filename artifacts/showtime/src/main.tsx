import { createRoot } from "react-dom/client";
import App from "./App";
import { installLocalApi } from "./data/local-api";
import "./index.css";

// The catalog ships in the bundle; patch fetch before anything renders so the
// generated API client resolves its `/api/*` calls against local data.
installLocalApi();

createRoot(document.getElementById("root")!).render(<App />);
