import { Heart, Music2, Leaf } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Remplacez par vos vraies données
  const rankings = [
    { rank: 1, pseudo: 'Joueur 1', score: 2450 },
    { rank: 2, pseudo: 'Joueur 2', score: 2100 },
    { rank: 3, pseudo: 'Joueur 3', score: 1890 },
    { rank: 4, pseudo: 'Joueur 4', score: 1650 },
    { rank: 5, pseudo: 'Joueur 5', score: 1480 },
    { rank: 6, pseudo: 'Joueur 6', score: 1320 },
    { rank: 7, pseudo: 'Joueur 7', score: 1150 },
    { rank: 8, pseudo: 'Joueur 8', score: 980 },
  ];

  const leaves = [
    { rotation: 45, color: '#d97706', delay: 0 },
    { rotation: -30, color: '#ea580c', delay: 0.5 },
    { rotation: 60, color: '#dc2626', delay: 1 },
    { rotation: -45, color: '#b45309', delay: 1.5 },
    { rotation: 30, color: '#c2410c', delay: 2 },
  ];

  return (
    <div className="size-full relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 25%, #fdba74 50%, #fb923c 75%, #f97316 100%)'
    }}>
      {/* Decorative overlay pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #78350f 2px, transparent 2px),
                         radial-gradient(circle at 75% 75%, #78350f 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Falling leaves animation */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, Math.random() * 100 - 50],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        >
          <Leaf
            size={16 + Math.random() * 24}
            className="text-orange-800/40"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
        </motion.div>
      ))}

      {/* Hearts decorations */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`heart-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 12}%`,
            top: `${5 + (i % 3) * 30}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <Heart
            size={20}
            className="text-red-600/30"
            fill="currentColor"
          />
        </motion.div>
      ))}

      <div className="relative z-10 size-full flex flex-col py-10 px-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <Leaf className="text-orange-900" size={44} />
            <h1 className="text-orange-950" style={{ 
              fontSize: '4rem',
              textShadow: '2px 2px 4px rgba(255,255,255,0.5)',
              fontFamily: 'serif'
            }}>
              Blind Test Musical
            </h1>
            <Heart className="text-red-700" size={44} fill="currentColor" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-24 rounded-full bg-orange-800/40" />
            <p className="text-orange-900 italic" style={{ fontSize: '1.6rem' }}>
              Mariage d'Automne
            </p>
            <div className="h-1 w-24 rounded-full bg-orange-800/40" />
          </div>
        </motion.div>

        {/* Podium Container */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div className="flex items-end justify-center gap-6 max-w-6xl w-full">
            {/* 2nd Place */}
            <motion.div
              className="flex flex-col items-center flex-1"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full blur-xl bg-amber-400/30" />
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #d4d4d4 0%, #e5e5e5 50%, #d4d4d4 100%)',
                  border: '4px solid #a3a3a3',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0,0,0,0.1)'
                }}>
                  <Music2 className="text-gray-600" size={56} />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white" style={{
                  background: '#a3a3a3',
                  fontSize: '1.3rem'
                }}>
                  2ème
                </div>
              </div>
              <h3 className="text-orange-950 mb-2" style={{ fontSize: '2rem', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>
                {rankings[1].pseudo}
              </h3>
              <div className="px-7 py-3 rounded-full" style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '3px solid #d4d4d4',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="text-gray-700" style={{ fontSize: '2rem' }}>
                  {rankings[1].score} pts
                </span>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              className="flex flex-col items-center flex-1"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-3"
              >
                <div className="relative">
                  <Heart className="text-red-600" size={56} fill="currentColor" style={{
                    filter: 'drop-shadow(0 4px 12px rgba(220, 38, 38, 0.5))'
                  }} />
                  <div className="absolute inset-0 blur-lg bg-red-500/40" />
                </div>
              </motion.div>
              <div className="relative mb-5">
                <motion.div 
                  className="absolute inset-0 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)'
                  }}
                />
                <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                  border: '5px solid #d97706',
                  boxShadow: '0 12px 48px rgba(251, 191, 36, 0.5), inset 0 -6px 12px rgba(217, 119, 6, 0.3)'
                }}>
                  <Music2 className="text-orange-900" size={72} />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-white" style={{
                  background: '#d97706',
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  1er
                </div>
              </div>
              <h3 className="text-orange-950 mb-3" style={{ fontSize: '2.5rem', textShadow: '2px 2px 4px rgba(255,255,255,0.5)' }}>
                {rankings[0].pseudo}
              </h3>
              <div className="px-9 py-4 rounded-full" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '3px solid #fbbf24',
                boxShadow: '0 6px 24px rgba(251, 191, 36, 0.3)'
              }}>
                <span className="text-orange-900" style={{ fontSize: '2.5rem' }}>
                  {rankings[0].score} pts
                </span>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              className="flex flex-col items-center flex-1"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full blur-xl bg-orange-400/30" />
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #cd7f32 0%, #b87333 50%, #cd7f32 100%)',
                  border: '4px solid #a0522d',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0,0,0,0.1)'
                }}>
                  <Music2 className="text-orange-100" size={56} />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white" style={{
                  background: '#a0522d',
                  fontSize: '1.3rem'
                }}>
                  3ème
                </div>
              </div>
              <h3 className="text-orange-950 mb-2" style={{ fontSize: '2rem', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>
                {rankings[2].pseudo}
              </h3>
              <div className="px-7 py-3 rounded-full" style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '3px solid #cd7f32',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="text-orange-800" style={{ fontSize: '2rem' }}>
                  {rankings[2].score} pts
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Rest of rankings */}
        <motion.div 
          className="max-w-5xl mx-auto w-full"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="grid grid-cols-2 gap-4">
            {rankings.slice(3).map((player, index) => (
              <motion.div
                key={player.rank}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '3px solid rgba(194, 65, 12, 0.3)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(8px)'
                }}
                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    border: '2px solid #ea580c',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span className="text-white" style={{ fontSize: '1.6rem' }}>
                      {player.rank}
                    </span>
                  </div>
                  <span className="text-orange-950" style={{ fontSize: '1.7rem' }}>
                    {player.pseudo}
                  </span>
                </div>
                <div className="px-6 py-2 rounded-full" style={{
                  background: 'rgba(251, 146, 60, 0.3)',
                  border: '2px solid rgba(234, 88, 12, 0.4)'
                }}>
                  <span className="text-orange-900" style={{ fontSize: '1.5rem' }}>
                    {player.score} pts
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-40">
          <Leaf className="text-orange-900" size={32} />
          <Heart className="text-red-700" size={28} fill="currentColor" />
          <Music2 className="text-orange-900" size={32} />
          <Heart className="text-red-700" size={28} fill="currentColor" />
          <Leaf className="text-orange-900" size={32} />
        </div>
      </div>
    </div>
  );
}
