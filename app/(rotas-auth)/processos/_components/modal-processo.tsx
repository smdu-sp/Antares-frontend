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
import { IProcesso } from "@/types/processo";
import { Plus, SquarePen } from "lucide-react";
import FormProcesso from "./form-processo";
import { useState } from "react";

export default function ModalProcesso({
  isUpdating,
  processo,
  showText = false,
}: {
  isUpdating: boolean;
  processo?: Partial<IProcesso>;
  showText?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={showText ? "lg" : "icon"}
          variant={"outline"}
          className={`${
            isUpdating
              ? "bg-background hover:bg-primary "
              : "bg-primary hover:bg-primary hover:opacity-70"
          } group transition-all ease-linear duration-200`}
        >
          {isUpdating ? (
            <>
              <SquarePen
                size={showText ? 20 : 28}
                className="text-primary group-hover:text-white group"
              />
              {showText && (
                <span className="ml-2 text-white">Editar Processo</span>
              )}
            </>
          ) : (
            <>
              <Plus size={showText ? 20 : 28} className="text-white group" />
              {showText && (
                <span className="ml-2 text-white">Criar Processo</span>
              )}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isUpdating ? "Editar " : "Criar "}Processo</DialogTitle>
          <DialogDescription>
            {isUpdating
              ? "Edite as informações do processo"
              : "Preencha os dados para criar um novo processo"}
          </DialogDescription>
        </DialogHeader>
        <FormProcesso
          processo={processo}
          isUpdating={isUpdating}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
