// import PublicHeader from '@/components/base/headers/PublicHeader';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* <PublicHeader /> */}
            {children}
        </div>
    );
}
