import { useState } from 'react'
import type { TabId } from './types'
import CalendarTab from './components/CalendarTab'
import DailyTrainingTab from './components/DailyTrainingTab'
import ExerciseListTab from './components/ExerciseListTab'
import ProgressTab from './components/ProgressTab'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'calendar', label: 'カレンダー', icon: '📅' },
  { id: 'today', label: '今日', icon: '💪' },
  { id: 'exercises', label: '種目', icon: '📋' },
  { id: 'progress', label: '進捗', icon: '📊' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleOpenTodayDetail = (date: Date) => {
    setSelectedDate(date)
    setActiveTab('today')
  }

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-slate-50">
      <header className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold text-center">トレーニング管理</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'calendar' && (
          <CalendarTab
            selectedDate={selectedDate}
            onSelectDate={handleCalendarDateSelect}
            onOpenDetail={handleOpenTodayDetail}
          />
        )}
        {activeTab === 'today' && <DailyTrainingTab date={selectedDate} />}
        {activeTab === 'exercises' && <ExerciseListTab />}
        {activeTab === 'progress' && <ProgressTab />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom max-w-lg mx-auto">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
