/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import FormRespostaFinal from "./form-resposta-final";
import { useState } from "react";
import { IProcesso } from "@/types/processo";

export default function ModalRespostaFinal({
  processo,
  onSuccess,
  variant = "default",
  size = "lg",
}: {
  processo: IProcesso;
  onSuccess?: () => void;
  variant?: "default" | "outline";
  size?: "sm" | "lg";
}) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <CheckCircle
            className={size === "lg" ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"}
          />
          Criar Resposta Final
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Resposta Final</DialogTitle>
          <DialogDescription>
            Registre a resposta final do processo ao solicitante
          </DialogDescription>
        </DialogHeader>
        <FormRespostaFinal processoData={processo} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
