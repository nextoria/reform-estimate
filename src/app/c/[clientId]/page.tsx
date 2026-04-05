import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClientConfig } from "@/lib/clients";
import ClientPageContent from "@/components/ClientPageContent";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { clientKey: clientId },
  });

  if (!client) notFound();

  if (!client.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-sm text-center">
          <div className="text-4xl mb-4">&#x1F6AB;</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">
            現在受付停止中です
          </h1>
          <p className="text-sm text-gray-500">
            このページは現在ご利用いただけません。
          </p>
        </div>
      </div>
    );
  }

  const config = getClientConfig(clientId);

  return (
    <ClientPageContent
      clientId={clientId}
      clientName={client.companyName}
      contactEmail={client.contactEmail}
      primaryColor={config.primaryColor}
    />
  );
}
