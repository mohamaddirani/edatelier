export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f8] via-white to-[#f8f6f4]" />
      
      {/* Elegant diagonal stripes pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            #DA9476 60px,
            #DA9476 61px
          )`
        }}
      />
      
      {/* Fabric texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, transparent 0%, rgba(0, 33, 71, 0.03) 50%, transparent 100%),
            radial-gradient(circle at 80% 80%, transparent 0%, rgba(218, 148, 118, 0.03) 50%, transparent 100%),
            radial-gradient(circle at 40% 20%, transparent 0%, rgba(189, 172, 150, 0.03) 50%, transparent 100%)
          `
        }}
      />

      {/* Subtle lace pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, #002147 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Fashion elements - decorative circles */}
      <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-[#DA9476]/10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-32 left-32 w-64 h-64 rounded-full border border-[#BDAC96]/10 animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full border border-[#002147]/5 animate-pulse" style={{ animationDuration: '12s' }} />
      
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/20" />
    </div>
  );
}
