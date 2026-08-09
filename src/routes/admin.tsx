import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useRole } from "@/hooks/use-role";
import { AuthCard } from "@/components/AuthCard";
import { AdminView } from "@/components/admin/AdminView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Usuários — Sprint Board" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { session, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useRole(session?.user.id);

  if (loading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  // Gating puramente visual: quem forjar a requisição bate na RLS.
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-pop">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da plataforma.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to="/">Voltar ao quadro</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AdminView currentUserId={session.user.id} />;
}
