import { createRoot } from "react-dom/client";
import App from "./App";

// Import Arabic fonts
import "@fontsource/noto-kufi-arabic/400.css";
import "@fontsource/noto-kufi-arabic/700.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/700.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/700.css";

import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);