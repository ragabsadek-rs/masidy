import { notFound, redirect } from "next/navigation";
import { getIntegrationBySlug } from "@/lib/integrations";

interface MarketplaceSlugPageProps {
  params: { slug: string };
}

export default function MarketplaceSlugPage({ params }: MarketplaceSlugPageProps) {
  const integration = getIntegrationBySlug(params.slug);

  if (!integration) {
    return notFound();
  }

  return redirect(`/dashboard/integrations/${params.slug}`);
}
