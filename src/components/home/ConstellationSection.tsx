import type { TabId } from '../../App'
import ConstellationPreview from './ConstellationPreview'

interface ConstellationSectionProps {
  onNavigate: (tab: TabId) => void
}

export default function ConstellationSection({ onNavigate }: ConstellationSectionProps) {
  return (
    <div id="constellation" className="relative">
      <ConstellationPreview onNavigate={onNavigate} />
    </div>
  )
}
