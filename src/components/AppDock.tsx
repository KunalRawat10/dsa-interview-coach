import { Telescope, Network, MessageCircleQuestion, Code2, BookOpen } from 'lucide-react'
import Dock, { type DockItemData } from './Dock'
import type { TabId } from '../App'

interface AppDockProps {
    activeTab: TabId
    onNavigate: (tab: TabId) => void
}

export default function AppDock({ activeTab, onNavigate }: AppDockProps) {
    const items: DockItemData[] = [
        {
            icon: <Telescope size={20} />,
            label: 'Observatory',
            onClick: () => onNavigate('dashboard'),
            isActive: activeTab === 'dashboard',
        },
        {
            icon: <Network size={20} />,
            label: 'Constellation',
            onClick: () => onNavigate('constellation'),
            isActive: activeTab === 'constellation',
        },
        {
            icon: <MessageCircleQuestion size={20} />,
            label: 'Socratic Chamber',
            onClick: () => onNavigate('chat'),
            isActive: activeTab === 'chat',
        },
        {
            icon: <Code2 size={20} />,
            label: 'Complexity Forge',
            onClick: () => onNavigate('analyzer'),
            isActive: activeTab === 'analyzer',
        },
        {
            icon: <BookOpen size={20} />,
            label: 'Knowledge Base',
            onClick: () => onNavigate('knowledge'),
            isActive: activeTab === 'knowledge',
        },
    ]

    return <Dock items={items} panelHeight={60} baseItemSize={44} magnification={64} distance={180} />
}