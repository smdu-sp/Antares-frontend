/** @format */

import { AlertCircle } from "lucide-react";

interface AccessStateProps {
  title: string;
  description: string;
}

export function AccessState({ title, description }: AccessStateProps) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}
