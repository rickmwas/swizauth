import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Security from "./pages/Security";
import Documentation from "./pages/Documentation";
import About from "./pages/About";
import Blog from "./pages/Blog";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/features"} component={Features} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/security"} component={Security} />
      <Route path={"/docs"} component={Documentation} />
      <Route path={"/about"} component={About} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
