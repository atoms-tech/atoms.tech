export function GridBackground() {
    return (
        <div className="inset-0 overflow-hidden pointer-events-none z-100">
            <div
                className="dark:invert inset-0 bg-[url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DLBgQX2afQp91OCarNsUwxr6dtvBc0.png')] bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DLBgQX2afQp91OCarNsUwxr6dtvBc0.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 1.0,
                }}
            />
            <div className="absolute inset-0 grid-background"></div>
        </div>
    );
}
