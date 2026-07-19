import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-border flex items-center justify-between border-b bg-background px-4 py-4 shadow-sm sm:px-6 lg:px-8">
      <Logo withText />

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {user?.roles[0] ?? "engineer"}
        </Badge>
        <div className="hidden rounded-md border border-input bg-secondary px-3 py-2 text-sm text-muted-foreground sm:block">
          {user?.name ?? "User"}
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut /> Sign out
        </Button>
      </div>
    </header>
  );
}
