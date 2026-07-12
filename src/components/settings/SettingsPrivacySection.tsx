import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const privacyLinks = [
  {
    label: "Privacy Policy",
    to: "/privacy",
  },
  {
    label: "Terms of Service",
    to: "/terms",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

export default function SettingsPrivacySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>
          Review project privacy, terms, and contact destinations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Separator />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {privacyLinks.map((link) => (
            <Button asChild key={link.to} variant="outline">
              <Link to={link.to}>
                {link.label}
                <ExternalLink />
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
