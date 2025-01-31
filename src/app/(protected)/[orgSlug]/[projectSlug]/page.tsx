export default async function ProjectPage({
    params,
}: {
    params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
    const projectSlug = (await params).projectSlug;

    return <h1>Project: {projectSlug}</h1>;
}
