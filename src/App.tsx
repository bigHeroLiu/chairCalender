import React, { useState, useEffect, useRef } from 'react';
import { 
  format, addDays, subDays, isSameDay, differenceInMinutes,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  addMonths, subMonths, parse 
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, AlignLeft, Users, Trash2, X, MessageCircle, Sparkles, Send, Loader2, Bell, CalendarDays, Filter } from 'lucide-react';
import { cn } from './lib/utils';

type Category = {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

const CATEGORIES: Category[] = [
  { id: 'work', name: '工作项目', color: '#ff3b30', bgColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#ff3b30' },
  { id: 'personal', name: '个人事务', color: '#34c759', bgColor: 'rgba(52, 199, 89, 0.1)', borderColor: '#34c759' },
  { id: 'study', name: '学习计划', color: '#007aff', bgColor: 'rgba(0, 122, 255, 0.1)', borderColor: '#007aff' },
  { id: 'team', name: '团队会议', color: '#ffcc00', bgColor: 'rgba(255, 204, 0, 0.1)', borderColor: '#ffcc00' },
];

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  categoryId: string;
  location?: string;
  description?: string;
  participants?: string;
};

const HOUR_HEIGHT = 60; // 1px per minute

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [alertEvent, setAlertEvent] = useState<CalendarEvent | null>(null);
  // 移动端状态
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Initialize events
  useEffect(() => {
    setEvents([]);
  }, []);

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for upcoming events
  useEffect(() => {
    const now = new Date();
    const upcoming = events.find(e => {
      if (notifiedEventsRef.current.has(e.id)) return false;
      const diffMins = differenceInMinutes(e.start, now);
      return diffMins >= 0 && diffMins <= 15;
    });

    if (upcoming) {
      setAlertEvent(upcoming);
      notifiedEventsRef.current.add(upcoming.id);
    }
  }, [currentTime, events]);

  // Scroll to current time
  useEffect(() => {
    if (scrollRef.current && isSameDay(currentDate, new Date())) {
      const topPosition = (currentTime.getHours() * HOUR_HEIGHT) + currentTime.getMinutes();
      scrollRef.current.scrollTop = Math.max(0, topPosition - window.innerHeight / 2 + 100);
    }
  }, [currentDate]);

  const toggleCategory = (id: string) => {
    const newActive = new Set(activeCategories);
    if (newActive.has(id)) newActive.delete(id);
    else newActive.add(id);
    setActiveCategories(newActive);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setSelectedEvent(null);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = isSameDay(currentDate, new Date());
  const dayEvents = events.filter(e => isSameDay(e.start, currentDate) && activeCategories.has(e.categoryId));
  
  // Sort events by start time for the AI prompt
  const sortedDayEvents = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Mini Calendar Logic
  const monthStart = startOfMonth(miniCalendarMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  // Current Week Logic
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  return (
    <div className="flex flex-col w-full h-full lg:w-[1024px] lg:h-[768px] bg-[var(--glass-bg)] backdrop-blur-[20px] lg:border border-[var(--glass-border)] lg:rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden text-[var(--text-primary)] font-sans lg:grid lg:grid-cols-[240px_1fr_280px] relative">
      
      {/* Sidebar (Left) */}
      <aside className="hidden lg:flex flex-col border-r border-[var(--glass-border)] p-6 gap-8 overflow-y-auto">
        {/* Mini Calendar */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-[16px]">{format(miniCalendarMonth, 'yyyy年 M月', { locale: zhCN })}</span>
            <div className="flex gap-1">
              <button onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))} className="p-1 hover:bg-white/30 rounded-md transition-colors"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))} className="p-1 hover:bg-white/30 rounded-md transition-colors"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {weekDays.map((d, i) => <div key={i} className="text-[var(--text-secondary)] py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, currentDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  onClick={() => { setCurrentDate(day); setMiniCalendarMonth(day); }}
                  className={cn(
                    "py-1.5 rounded-full cursor-pointer transition-colors flex items-center justify-center",
                    !isCurrentMonth ? "text-gray-400" : "text-[var(--text-primary)]",
                    isSelected && !isTodayDate ? "bg-white/50 font-semibold" : "",
                    isTodayDate ? "bg-[var(--accent)] text-white font-semibold" : (!isSelected && "hover:bg-white/30")
                  )}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendars List */}
        <div>
          <div className="font-semibold text-[14px] mb-4">我的日历</div>
          <ul className="space-y-3">
            {CATEGORIES.map(cat => (
              <li 
                key={cat.id} 
                className="flex items-center gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleCategory(cat.id)}
              >
                <div 
                  className={cn("w-3 h-3 rounded-full border-2 transition-all", activeCategories.has(cat.id) ? "border-transparent" : "bg-transparent")}
                  style={{ backgroundColor: activeCategories.has(cat.id) ? cat.color : 'transparent', borderColor: cat.color }}
                />
                <span className={!activeCategories.has(cat.id) ? "text-[var(--text-secondary)] line-through" : ""}>{cat.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Schedule (Center) */}
      <main className="flex flex-col flex-1 overflow-hidden relative px-3 sm:px-6 pb-6 pt-0">
        <header className="h-[70px] sm:h-[80px] flex-shrink-0 flex items-center justify-between border-b border-[var(--glass-border)]">
          <div className="min-w-0 flex-1 mr-2 flex items-center gap-2">
            {/* 移动端日期选择按钮 */}
            <button 
              onClick={() => setIsDatePickerOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 bg-white/40 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"
            >
              <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-[20px] font-bold truncate">
                {viewMode === 'day' 
                  ? format(currentDate, 'M月d日 EEEE', { locale: zhCN })
                  : `${format(currentWeekStart, 'M月d日', { locale: zhCN })} - ${format(currentWeekEnd, 'M月d日', { locale: zhCN })}`}
              </h1>
              <p className="text-[11px] sm:text-[14px] text-[var(--text-secondary)] truncate">今天共有 {dayEvents.length} 个日程安排</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
            {/* Mobile AI Button */}
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="lg:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full text-white shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            
            <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-white/50 hover:bg-white/70 border border-[var(--glass-border)] rounded-lg transition-colors">
              今日
            </button>
            <div className="flex border border-[var(--glass-border)] rounded-lg overflow-hidden bg-white/30">
              <button 
                onClick={() => setViewMode('day')}
                className={cn("px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors", viewMode === 'day' ? "bg-white/70 shadow-sm" : "hover:bg-white/50")}
              >
                <span className="sm:hidden">日</span>
                <span className="hidden sm:inline">日视图</span>
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn("px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors", viewMode === 'week' ? "bg-white/70 shadow-sm" : "hover:bg-white/50")}
              >
                <span className="sm:hidden">周</span>
                <span className="hidden sm:inline">周视图</span>
              </button>
            </div>
            {/* 移动端分类筛选按钮 */}
            <button 
              onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
              className="lg:hidden flex items-center justify-center w-8 h-8 bg-white/40 hover:bg-white/60 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </header>

        {/* 移动端分类筛选下拉面板 */}
        {isCategoryFilterOpen && (
          <div className="lg:hidden flex-shrink-0 px-1 py-3 border-b border-[var(--glass-border)] bg-white/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    activeCategories.has(cat.id) ? "shadow-sm" : "opacity-40"
                  )}
                  style={{
                    backgroundColor: activeCategories.has(cat.id) ? cat.bgColor : 'transparent',
                    color: cat.color,
                    border: `1px solid ${activeCategories.has(cat.id) ? cat.borderColor : 'transparent'}`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="flex ml-10 sm:ml-14 pr-2 pt-3 pb-2 border-b border-[var(--glass-border)] flex-shrink-0">
            {currentWeekDays.map(day => (
              <div key={day.toISOString()} className="flex-1 text-center cursor-pointer" onClick={() => {setCurrentDate(day); setViewMode('day');}}>
                <div className="text-[11px] text-[var(--text-secondary)] uppercase">{format(day, 'E', { locale: zhCN })}</div>
                <div className={cn("text-[15px] font-medium w-7 h-7 mx-auto flex items-center justify-center rounded-full mt-0.5 transition-colors", isSameDay(day, new Date()) ? "bg-[var(--accent)] text-white" : "hover:bg-black/5")}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative mt-4 border-t border-[var(--glass-border)]" ref={scrollRef}>
          <div className="flex min-h-[1440px] relative">
            {/* Time Labels */}
            <div className="w-10 sm:w-14 flex-shrink-0 relative">
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="absolute w-full text-right pr-2 sm:pr-3 text-[10px] sm:text-[11px] text-[#999] font-medium"
                  style={{ top: `${hour * HOUR_HEIGHT - 8}px` }}
                >
                  {hour === 0 ? '' : `${hour}:00`}
                </div>
              ))}
            </div>

            {/* Grid Lines & Columns */}
            <div className="flex-1 relative flex">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="absolute w-full border-t border-[rgba(0,0,0,0.03)]"
                    style={{ top: `${hour * HOUR_HEIGHT}px` }}
                  />
                ))}
              </div>

              {/* Columns */}
              {(viewMode === 'day' ? [currentDate] : currentWeekDays).map((day, colIndex) => {
                const isThisColumnToday = isSameDay(day, new Date());
                const colEvents = events.filter(e => isSameDay(e.start, day) && activeCategories.has(e.categoryId));
                
                return (
                  <div key={day.toISOString()} className="flex-1 relative border-l border-[rgba(0,0,0,0.03)]">
                    {isThisColumnToday && (
                      <div 
                        className="absolute w-full z-20 pointer-events-none flex items-center"
                        style={{ top: `${currentTime.getHours() * HOUR_HEIGHT + currentTime.getMinutes()}px`, transform: 'translateY(-50%)' }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] -ml-[5px]" />
                        <div className="flex-1 h-[2px] bg-[var(--accent)] opacity-50" />
                      </div>
                    )}

                    <div className="absolute inset-0 right-0.5 sm:right-1">
                      {colEvents.map((event) => {
                        const cat = CATEGORIES.find(c => c.id === event.categoryId)!;
                        const startMins = event.start.getHours() * 60 + event.start.getMinutes();
                        const durationMins = differenceInMinutes(event.end, event.start);
                        const isSelected = selectedEvent?.id === event.id;

                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              "absolute overflow-hidden transition-all cursor-pointer",
                              viewMode === 'day' 
                                ? "left-0.5 right-0.5 sm:left-1 sm:right-1 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border-l-4" 
                                : "left-0.5 right-0.5 sm:left-1 sm:right-1 rounded-md sm:rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 border-l-2 sm:border-l-4",
                              isSelected ? "ring-2 ring-[var(--accent)] shadow-md z-10" : "hover:opacity-90"
                            )}
                            style={{
                              top: `${startMins}px`,
                              height: `${Math.max(durationMins, 24)}px`,
                              backgroundColor: cat.bgColor,
                              borderColor: cat.borderColor,
                            }}
                          >
                            <div className={cn("font-semibold truncate mb-0.5", viewMode === 'day' ? "text-xs sm:text-sm" : "text-[9px] sm:text-xs leading-tight")} style={{ color: cat.color }}>{event.title}</div>
                            {durationMins >= 30 && (
                              <div className={cn("opacity-80 truncate text-[var(--text-secondary)]", viewMode === 'day' ? "text-[10px] sm:text-xs" : "hidden sm:block text-[10px]")}>
                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                {viewMode === 'day' && event.location && ` | ${event.location}`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Panel (Right) - Desktop */}
      <section className="hidden lg:flex flex-col border-l border-[var(--glass-border)] bg-white/20 p-6 overflow-y-auto">
        <div className="text-[20px] font-semibold mb-6">日程详情</div>
        
        {selectedEvent ? (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">标题</div>
              <div className="text-[16px] font-semibold">{selectedEvent.title}</div>
            </div>

            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">时间</div>
              <div className="flex items-center gap-2 text-[14px]">
                <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                {format(selectedEvent.start, 'a h:mm', { locale: zhCN })} - {format(selectedEvent.end, 'a h:mm', { locale: zhCN })} 
                <span className="text-[var(--text-secondary)]">
                  ({differenceInMinutes(selectedEvent.end, selectedEvent.start) / 60}小时)
                </span>
              </div>
            </div>

            {selectedEvent.location && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">地点</div>
                <div className="flex items-center gap-2 text-[14px]">
                  <MapPin className="w-4 h-4 text-[var(--text-secondary)]" />
                  {selectedEvent.location}
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">描述</div>
                <div className="flex items-start gap-2 text-[14px]">
                  <AlignLeft className="w-4 h-4 text-[var(--text-secondary)] mt-0.5" />
                  <div className="whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</div>
                </div>
              </div>
            )}

            {selectedEvent.participants && (
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">参与人员</div>
                <div className="flex items-center gap-2 text-[14px]">
                  <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                  {selectedEvent.participants}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6">
              <button 
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="w-full py-3 rounded-xl bg-white/50 hover:bg-red-50 text-red-500 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除日程
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-60 text-center">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p>选择一个日程查看详情</p>
          </div>
        )}
      </section>

      {/* Floating ChatAI Button (Desktop Only) */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-tr from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full items-center justify-center text-white shadow-[0_10px_20px_rgba(0,122,255,0.3)] transition-transform hover:scale-105 z-50"
      >
        <Sparkles className="w-7 h-7" />
      </button>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAddingEvent(true)}
        className="absolute bottom-6 right-6 lg:bottom-8 lg:right-[310px] w-12 h-12 sm:w-14 sm:h-14 bg-[var(--accent)] hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_20px_rgba(0,122,255,0.3)] transition-transform hover:scale-105 z-30"
      >
        <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Chat Panel */}
      {isChatOpen && (
        <ChatPanel 
          events={sortedDayEvents} 
          currentDate={currentDate}
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {/* Add Event Modal */}
      {isAddingEvent && (
        <AddEventModal 
          onClose={() => setIsAddingEvent(false)} 
          onAdd={(newEvent) => {
            setEvents([...events, newEvent]);
            setIsAddingEvent(false);
          }}
          currentDate={currentDate}
        />
      )}

      {/* Upcoming Event Alert Modal */}
      {alertEvent && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
              <div className="p-2 bg-blue-50 rounded-full">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">日程即将开始</h2>
            </div>
            <div className="mb-6">
              <div className="text-xl font-semibold mb-2">{alertEvent.title}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                {format(alertEvent.start, 'HH:mm')} - {format(alertEvent.end, 'HH:mm')}
              </div>
              {alertEvent.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {alertEvent.location}
                </div>
              )}
            </div>
            <button 
              onClick={() => setAlertEvent(null)}
              className="w-full py-2.5 rounded-xl font-medium bg-[var(--accent)] text-white hover:bg-blue-600 transition-colors shadow-md"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* ========== 移动端日期选择器（Bottom Sheet）========== */}
      {isDatePickerOpen && (
        <MobileDatePicker
          currentDate={currentDate}
          miniCalendarMonth={miniCalendarMonth}
          calendarDays={calendarDays}
          monthStart={monthStart}
          weekDays={weekDays}
          activeCategories={activeCategories}
          CATEGORIES={CATEGORIES}
          onSelectDate={(day) => { setCurrentDate(day); setMiniCalendarMonth(day); setIsDatePickerOpen(false); }}
          onChangeMonth={(dir) => setMiniCalendarMonth(dir)}
          onToggleCategory={toggleCategory}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}

      {/* ========== 移动端日程详情（Bottom Sheet）========== */}
      {selectedEvent && (
        <MobileEventDetail
          event={selectedEvent}
          CATEGORIES={CATEGORIES}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
        />
      )}
    </div>
  );
}

// ========== 移动端日期选择器组件 ==========
function MobileDatePicker({
  currentDate, miniCalendarMonth, calendarDays, monthStart, weekDays,
  activeCategories, CATEGORIES, onSelectDate, onChangeMonth, onToggleCategory, onClose
}: {
  currentDate: Date; miniCalendarMonth: Date; calendarDays: Date[]; monthStart: Date;
  weekDays: string[]; activeCategories: Set<string>; CATEGORIES: Category[];
  onSelectDate: (d: Date) => void; onChangeMonth: (d: Date) => void;
  onToggleCategory: (id: string) => void; onClose: () => void;
}) {
  return (
    <div className="lg:hidden fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        {/* 拖拽指示条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h3 className="text-lg font-bold">选择日期</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 月份切换 */}
        <div className="flex items-center justify-center gap-4 px-5 pb-3">
          <button onClick={() => onChangeMonth(subMonths(miniCalendarMonth, 1))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold min-w-[120px] text-center">{format(miniCalendarMonth, 'yyyy年 M月', { locale: zhCN })}</span>
          <button onClick={() => onChangeMonth(addMonths(miniCalendarMonth, 1))} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 日历网格 */}
        <div className="px-5 pb-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {weekDays.map((d, i) => <div key={i} className="text-gray-400 py-2 font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, currentDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isSameDay(day, new Date());
              return (
                <button
                  key={i}
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    "py-2 rounded-full transition-all flex items-center justify-center",
                    !isCurrentMonth ? "text-gray-300" : "",
                    isSelected && !isTodayDate ? "bg-gray-200 font-semibold" : "",
                    isTodayDate ? "bg-[var(--accent)] text-white font-bold" : (!isSelected && isCurrentMonth && "hover:bg-gray-100 active:bg-gray-200")
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="px-5 py-4 border-t border-gray-100 mt-2">
          <div className="text-xs text-gray-400 font-medium mb-3">日历分类</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => onToggleCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeCategories.has(cat.id) ? "shadow-sm" : "opacity-40 grayscale"
                )}
                style={{
                  backgroundColor: activeCategories.has(cat.id) ? cat.bgColor : 'transparent',
                  color: cat.color,
                  border: `1px solid ${activeCategories.has(cat.id) ? cat.borderColor : '#e5e5e5'}`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={() => { onSelectDate(new Date()); }}
            className="flex-1 py-3 rounded-xl font-medium bg-[var(--accent)] text-white hover:bg-blue-600 transition-colors shadow-md"
          >
            回到今天
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== 移动端日程详情组件（Bottom Sheet）==========
function MobileEventDetail({
  event, CATEGORIES, onClose, onDelete
}: {
  event: CalendarEvent; CATEGORIES: Category[];
  onClose: () => void; onDelete: () => void;
}) {
  const cat = CATEGORIES.find(c => c.id === event.categoryId)!;

  return (
    <div className="lg:hidden fixed inset-0 z-[53] flex items-end justify-center bg-black/25 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300" 
        onClick={e => e.stopPropagation()}
      >
        {/* 拖拽指示条 + 关闭 */}
        <div className="flex justify-center pt-3 pb-1 relative">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        
        {/* 颜色条 */}
        <div className="h-1.5 w-full" style={{ backgroundColor: cat.color }} />

        {/* 内容区 */}
        <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
          {/* 标题 */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full transition-colors flex-shrink-0 mt-1">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 分类标签 */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-5" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.name}
          </div>

          {/* 时间 */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {format(event.start, 'MM月dd日 HH:mm', { locale: zhCN })} - {format(event.end, 'HH:mm')}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                时长 {differenceInMinutes(event.end, event.start) / 60} 小时
              </div>
            </div>
          </div>

          {/* 地点 */}
          {event.location && (
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-sm text-gray-700 pt-1.5">{event.location}</div>
            </div>
          )}

          {/* 描述 */}
          {event.description && (
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <AlignLeft className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pt-1.5">{event.description}</div>
            </div>
          )}

          {/* 参与人员 */}
          {event.participants && (
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-sm text-gray-700 pt-1.5">{event.participants}</div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
          >
            关闭
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-3 rounded-xl font-medium bg-red-50 hover:bg-red-100 text-red-500 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// Chat Panel Component
function ChatPanel({ events, currentDate, onClose }: { events: CalendarEvent[], currentDate: Date, onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: '你好！我是你的日历AI助手。我可以帮你总结今天的日程，或者根据你的安排提供建议。你可以对我说："总结一下今天的工作"。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const scheduleText = events.length > 0 
        ? events.map(e => `- ${format(e.start, 'HH:mm')}至${format(e.end, 'HH:mm')}: ${e.title} (${CATEGORIES.find(c=>c.id===e.categoryId)?.name || ''})`).join('\n')
        : '今天没有安排日程。';

      const prompt = `你是一个专业的日程管理AI助手。请用中文回答。
当前日期是：${format(currentDate, 'yyyy年M月d日')}
当前用户的日程安排如下：
${scheduleText}

用户的问题/指令是：${userText}

请根据日程安排回答用户，如果用户要求总结，请简明扼要地提炼核心工作，并给出合理的建议（如休息时间、优先级等）。回答请保持友好、专业的语气，排版清晰。`;

      const response = await fetch('https://api.vectorengine.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-UDOgr009wDxwNzqz2gjmAzaFXaq7CCkfIZSHmjkRRQ6oVxAQ',
        },
        body: JSON.stringify({
          model: 'deepseek-v4-pro',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const aiText = (data.choices?.[0]?.message?.content || '抱歉，我没有理解你的意思。').replace(/\*\*/g, '');

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，AI服务暂时不可用，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed z-50 flex flex-col overflow-hidden transition-all bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl lg:bottom-24 lg:right-8 lg:w-96 lg:h-[450px] lg:top-auto lg:left-auto top-16 left-4 right-4 bottom-4 sm:top-20">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-4 h-4" />
          AI 日程助手
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm", 
              m.role === 'user' ? "bg-[var(--accent)] text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
            )}>
              {m.text.split('\n').map((line, j) => <React.Fragment key={j}>{line}<br/></React.Fragment>)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2 shadow-sm border border-gray-100">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
              思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-white/50 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-1.5 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all shadow-sm">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入指令，例如：总结今天日程"
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="text-[var(--accent)] disabled:opacity-50 p-1.5 hover:bg-blue-50 rounded-full transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Add Event Modal Component
function AddEventModal({ onClose, onAdd, currentDate }: { onClose: () => void, onAdd: (e: CalendarEvent) => void, currentDate: Date }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [categoryId, setCategoryId] = useState('work');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const start = parse(`${dateStr} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${dateStr} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      title,
      start,
      end,
      categoryId,
      location,
      description
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">新建日程</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              autoFocus
              type="text" 
              placeholder="日程标题" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-base sm:text-lg font-medium bg-transparent border-b border-gray-300 focus:border-[var(--accent)] outline-none py-2 px-1 transition-colors"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始时间</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束时间</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">日历分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">地点（选填）</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">描述（选填）</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">取消</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl font-medium bg-[var(--accent)] text-white hover:bg-blue-600 transition-colors shadow-md">添加日程</button>
          </div>
        </form>
      </div>
    </div>
  );
}
