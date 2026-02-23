import { motion } from "framer-motion";

function FloatingPaths({ position }) {
    const paths = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        d: `M-${200 - i * 5 * position} -${100 + i * 3}C-${200 - i * 5 * position
            } -${100 + i * 3} -${156 - i * 5 * position} ${108 - i * 3} ${76 - i * 5 * position
            } ${172 - i * 3}C${308 - i * 5 * position} ${235 - i * 3} ${342 - i * 5 * position
            } ${437 - i * 3} ${342 - i * 5 * position} ${437 - i * 3}`,
        width: 0.5 + i * 0.05,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="0 0 400 300"
                fill="none"
                style={{
                    color: '#7c9cff',
                    minWidth: '100%',
                    minHeight: '100%'
                }}
                preserveAspectRatio="xMidYMid slice"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.02}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths() {

    return (
        <div className="background-paths-container">
            {/* Test visibility with a more visible colored overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 30% 40%, rgba(124, 156, 255, 0.15), transparent 50%), radial-gradient(circle at 70% 60%, rgba(124, 92, 255, 0.1), transparent 50%)',
                pointerEvents: 'none'
            }} />
            <div className="background-paths-wrapper">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>
        </div>
    );
}