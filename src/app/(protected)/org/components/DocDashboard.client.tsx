'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    CalendarDays,
    FileText,
    GitBranch,
    ListTodo,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import LayoutView from '@/components/views/LayoutView';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getDocumentData } from '@/lib/db/client';
import { useDocumentStore } from '@/lib/store/document.store';
import { ERequirementPriority, ERequirementStatus } from '@/types';

type BlockContent = {
    status: ERequirementStatus;
    priority: ERequirementPriority;
};

export default function DocDashboard() {
    const params = useParams();
    const documentId = params.documentId as string;
    const { blocks } = useDocumentStore();
    const [isFlipped, setIsFlipped] = useState(false);

    const { data: documentInfo } = useQuery({
        queryKey: queryKeys.documents.detail(documentId),
        queryFn: () => getDocumentData(documentId),
    });

    const stats = {
        total: blocks?.length || 0,
        completion: blocks?.length
            ? Math.round(
                  (blocks.filter(
                      (b) => (b.content as BlockContent)?.status === 'approved',
                  ).length /
                      blocks.length) *
                      100,
              )
            : 0,
        highPriority:
            blocks?.filter(
                (b) => (b.content as BlockContent)?.priority === 'high',
            ).length || 0,
        completed:
            blocks?.filter(
                (b) => (b.content as BlockContent)?.status === 'in_progress',
            ).length || 0,
    };

    if (!blocks) {
        return (
            <div className="container mx-auto py-6">
                No blocks found, create one using the canvas view.
            </div>
        );
    }

    return (
        <LayoutView>
            <div className="container mx-auto py-6">
                {/* Document Header */}
                <motion.div
                    className="perspective-1000 card-flip-container relative"
                    onClick={() => setIsFlipped(!isFlipped)}
                    initial={false}
                    animate={{ y: isFlipped ? -2 : 0 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        animate={{ rotateX: isFlipped ? 180 : 0 }}
                        transition={{
                            duration: 0.6,
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            bounce: 0.2,
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative"
                    >
                        {/* Front of card */}
                        <motion.div
                            className={`${isFlipped ? 'backface-hidden' : ''}`}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <Card className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold">
                                            {documentInfo?.name}
                                        </h1>
                                        <p className="text-muted-foreground mt-1">
                                            {documentInfo?.description}
                                        </p>
                                        <div className="flex gap-2 mt-4">
                                            {documentInfo?.tags?.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <GitBranch className="h-4 w-4" />
                                            <span>
                                                Version {documentInfo?.version}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarDays className="h-4 w-4" />
                                            <span>
                                                Updated{' '}
                                                {new Date(
                                                    documentInfo?.updated_at ||
                                                        '',
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Back of card */}
                        <motion.div
                            className={`absolute top-0 left-0 w-full ${!isFlipped ? 'backface-hidden' : ''}`}
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateX(180deg)',
                            }}
                        >
                            <Card className="p-6 hover:shadow-lg transition-shadow">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="flex items-center gap-4">
                                        <FileText className="h-8 w-8 text-primary" />
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {stats.total}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Total Requirements
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Activity className="h-8 w-8 text-primary" />
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {stats.completion}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Completion Rate
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <BarChart3 className="h-8 w-8 text-primary" />
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {stats.highPriority}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                High Priority
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <ListTodo className="h-8 w-8 text-primary" />
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {stats.completed}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Active Requirements
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                </motion.div>

                <br />
            </div>
        </LayoutView>
    );
}
