import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Sprint } from "@/lib/board";

function diffDays(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function SprintDialog({
  sprint,
  open,
  count,
  onOpenChange,
}: {
  sprint: Sprint | null;
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [quarter, setQuarter] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (!open) return;
    setCode(sprint?.code ?? "");
    setQuarter(sprint?.quarter ?? "");
    setStart(sprint?.start_date ?? "");
    setEnd(sprint?.end_date ?? "");
  }, [open, sprint]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: code.trim(),
        quarter: quarter.trim(),
        start_date: start,
        end_date: end,
        days: diffDays(start, end),
        position: sprint?.position ?? count,
      };
      const res = sprint
        ? await supabase.from("sprints").update(payload).eq("id", sprint.id)
        : await supabase.from("sprints").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!sprint) return;
      const { error } = await supabase.from("sprints").delete().eq("id", sprint.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      qc.invalidateQueries({ queryKey: ["allocations"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = code.trim() && start && end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sprint ? "Editar sprint" : "Nova sprint"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scode">Sprint</Label>
              <Input
                id="scode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="26.3.1"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="squarter">Quarter</Label>
              <Input
                id="squarter"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="Q3"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sstart">Início</Label>
              <Input
                id="sstart"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="send">Fim</Label>
              <Input id="send" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {start && end ? (
            <p className="text-xs text-muted-foreground">
              Duração: {diffDays(start, end)} dias corridos
            </p>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          {sprint ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => remove.mutate()}
            >
              <Trash2 className="size-4" /> Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={!valid || save.isPending}>
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
