import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { StatsSection } from './components/Stats'
import { TheTek } from './components/TheTek'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { useStats } from './hooks/useStats'

export default function App() {
  const { stats, loaded } = useStats()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <StatsSection stats={stats} loaded={loaded} />
        <TheTek />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
