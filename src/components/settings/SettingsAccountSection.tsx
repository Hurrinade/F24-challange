import { SignOutButton, UserButton, useClerk } from "@clerk/react";
import { LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsAccountSection() {
  const { openUserProfile } = useClerk();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your Clerk account profile or sign out.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center rounded-lg border border-border bg-background/70 p-3">
          <UserButton showName />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              openUserProfile();
            }}
            type="button"
            variant="outline"
          >
            <UserCog />
            Manage profile
          </Button>

          <SignOutButton redirectUrl="/">
            <Button className="w-full sm:w-auto" type="button" variant="ghost">
              <LogOut />
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </CardContent>
    </Card>
  );
}
