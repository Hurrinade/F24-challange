import { ThemeToggle } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsThemeSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose the interface theme stored on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-fit">
        <ThemeToggle />
      </CardContent>
    </Card>
  );
}
