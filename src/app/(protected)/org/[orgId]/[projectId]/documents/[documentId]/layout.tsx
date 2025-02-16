import { getDocumentBlocksAndRequirementsServer, getDocumentDataServer } from "@/lib/db/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/constants/queryKeys";

interface DocumentLayoutProps {
    children: React.ReactNode;
    params: Promise<{ documentId: string }>;
}

export default async function DocumentLayout({
    children,
    params,
}: DocumentLayoutProps) {
    const { documentId } = await params;
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: async () => {
            return await getDocumentBlocksAndRequirementsServer(documentId);
        },
    });

    await queryClient.prefetchQuery({
        queryKey: queryKeys.documents.detail(documentId),
        queryFn: async () => {
            return await getDocumentDataServer(documentId);
        },
    });
    return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}