import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/terms")({
  component: () => (
    <LegalShell title="Terms of Service" updated="May 2026">
      <p>These terms govern use of the Intragoals platform. By accessing the service you agree to use it only for lawful business purposes within your organization.</p>
      <p>Customer is responsible for the accuracy of goal content, quarterly updates, and administrative configurations. Intragoals provides the platform on an "as available" basis with the security and uptime commitments in your master agreement.</p>
      <p>Subscriptions renew annually unless cancelled. For the full agreement, contact your account manager.</p>
    </LegalShell>
  ),
});
