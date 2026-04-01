import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import ClientPageContent from "@/components/ClientPageContent";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = getClient(clientId);
  if (!client) notFound();

  return (
    <ClientPageContent
      clientId={clientId}
      clientName={client.name}
      primaryColor={client.primaryColor}
    />
  );
}
