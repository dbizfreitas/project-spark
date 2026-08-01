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
import { DEV_COLORS, initialsFrom, type Dev } from "@/lib/board";

export function DevDialog({
  dev,
  open,
  count,
  onOpenChange,
}: {
  dev: Dev | null;
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEV_COLORS[0]!);

  useEffect(() => {
    if (!open) return;
    setName(dev?.name ?? "");
    setColor(dev?.color ?? DEV_COLORS[count % DEV_COLORS.length]!);
  }, [open, dev, count]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        initials: initialsFrom(name),
        color,
        position: dev?.position ?? count,
      };
      const res = dev
        ? await supabase.from("devs").update(payload).eq("id", dev.id)
        : await supabase.from("devs").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!dev) return;
      const { error } = await supabase.from("devs").delete().eq("id", dev.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devs"] });
      qc.invalidateQueries({ queryKey: ["allocations"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{dev ? "Editar pessoa" : "Nova pessoa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dname">Nome</Label>
            <Input
              id="dname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Daniel A."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {DEV_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`size-7 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-ring ring-offset-2" : ""
                  }`}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {dev ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => remove.mutate()}
            >
              <Trash2 className="size-4" /> Remover
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
