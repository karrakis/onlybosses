import * as React from "react";
import Home from "./Home";
import Admin from "./Admin";

type Route = "home" | "admin";

function pathToRoute(): Route {
  return window.location.pathname.startsWith("/admin") ? "admin" : "home";
}

export default function App({ availableKeywords }: { availableKeywords: string[] }) {
  const [route, setRoute] = React.useState<Route>(pathToRoute);

  function navigate(to: Route, url?: string) {
    setRoute(to);
    const path = url ?? (to === "admin" ? "/admin" : "/");
    history.pushState({}, "", path);
  }

  React.useEffect(() => {
    const handler = () => setRoute(pathToRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (route === "admin") {
    return <Admin onNavigateHome={() => navigate("home", "/")} />;
  }
  return (
    <Home
      availableKeywords={availableKeywords}
      onNavigate={(to) => navigate(to as Route)}
    />
  );
}
