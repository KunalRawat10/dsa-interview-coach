import { memo } from 'react'

const HomeBackground = memo(function HomeBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        backgroundColor: '#07090E',
        backgroundImage: `
          radial-gradient(circle at 80% 12%, rgba(74, 114, 255, 0.07) 0%, transparent 50%),
          radial-gradient(circle at 15% 65%, rgba(74, 114, 255, 0.04) 0%, transparent 45%),
          radial-gradient(circle at 50% 90%, rgba(74, 114, 255, 0.05) 0%, transparent 55%)
        `,
      }}
    >
      {/* Subtle Technical Blueprint Texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="technicalBlueprintGrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
            <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#technicalBlueprintGrid)" />
      </svg>
    </div>
  )
})

export default HomeBackground
