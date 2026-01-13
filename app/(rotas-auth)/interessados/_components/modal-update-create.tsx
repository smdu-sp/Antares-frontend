/** @format */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IInteressado } from "@/types/interessado";
import { Plus, SquarePen } from "lucide-react";
import FormInteressado from "./form-interessado";

export default function ModalUpdateAndCreate({
  isUpdating,
  interessado,
}: {
  isUpdating?: boolean;
  interessado?: Partial<IInteressado>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={"icon"}
          variant={"outline"}
          className={`${
            isUpdating
              ? "bg-background hover:bg-primary "
              : "bg-primary hover:bg-primary hover:opacity-70"
          } group transition-all ease-linear duration-200`}
        >
          {isUpdating ? (
            <SquarePen
              size={28}
              className="text-primary group-hover:text-white group"
            />
          ) : (
            <Plus size={28} className="text-white group" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdating ? "Editar " : "Criar "}Interessado
          </DialogTitle>
          <DialogDescription>
            Gerencie as informações do interessado selecionado.
          </DialogDescription>
        </DialogHeader>
        <FormInteressado interessado={interessado} isUpdating={isUpdating} />
      </DialogContent>
    </Dialog>
  );
}
