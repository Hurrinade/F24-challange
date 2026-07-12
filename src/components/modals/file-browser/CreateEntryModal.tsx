import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CreateEntryModalPayload } from "@/types";

type CreateEntryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: CreateEntryModalPayload;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function CreateEntryModal({
  open,
  onOpenChange,
  payload,
}: CreateEntryModalProps) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await payload.onSubmit(trimmedName);
      setName("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      setName("");
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={!isSubmitting}
      >
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="px-5 pt-6 pb-5 sm:px-6">
            <DialogHeader>
              <DialogTitle>{payload.title}</DialogTitle>
              <DialogDescription>{payload.description}</DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="entry-name"
              >
                {payload.label}
              </label>
              <Input
                id="entry-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
                autoFocus
              />
              {errorMessage && (
                <p className="text-sm leading-5 text-destructive">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="bg-card px-5 py-4 sm:px-6">
            <DialogFooter className="gap-2 border-t-0 pt-0 sm:justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:min-w-28 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : payload.submitText}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleOpenChange(false);
                }}
                disabled={isSubmitting}
                className="w-full sm:min-w-24 sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
