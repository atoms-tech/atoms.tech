declare module '@icons-pack/react-simple-icons' {
    // The package does not ship TypeScript types. We provide a minimal
    // declaration so Next.js type checking can succeed.
    import type { ComponentType, SVGProps } from 'react';

    export const SiGithub: ComponentType<SVGProps<SVGSVGElement>>;
    export const SiGitlab: ComponentType<SVGProps<SVGSVGElement>>;
    export const SiBitbucket: ComponentType<SVGProps<SVGSVGElement>>;

    // Fallback export map for other icons if needed by name
    const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>>;
    export default icons;
}

