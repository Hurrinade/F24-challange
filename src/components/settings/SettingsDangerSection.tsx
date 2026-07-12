import { useClerk, useUser } from "@clerk/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModal } from "@/hooks/modals/use-modal";

export default function SettingsDangerSection() {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const { openModal } = useModal();

  const isDeleteDisabled = !isLoaded || !user || !user.deleteSelfEnabled;

  const deleteDescription = !isLoaded
    ? "Loading account deletion availability."
    : !user
      ? "Sign in to manage account deletion."
      : !user.deleteSelfEnabled
        ? "Self-service account deletion is disabled in Clerk for this project."
        : "Delete your account and sign out of this app.";

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>{deleteDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          disabled={isDeleteDisabled}
          onClick={() => {
            if (!user) {
              return;
            }

            openModal("confirm", {
              title: "Delete account?",
              message:
                "This permanently deletes your Clerk account. Template-owned Convex user data is removed by the existing Clerk user.deleted webhook.",
              confirmText: "Delete account",
              cancelText: "Keep account",
              variant: "danger",
              onConfirm: async () => {
                await user.delete();
                await signOut({ redirectUrl: "/" });
              },
            });
          }}
          type="button"
          variant="destructive"
        >
          <Trash2 />
          Delete account
        </Button>
      </CardContent>
    </Card>
  );
}
