// Session storage utilities for task persistence
const TASKS_STORAGE_KEY = 'pomodoro_tasks';
const TIMER_STATE_KEY = 'pomodoro_timer_state';

export const sessionStorage = {
  saveTasks: (tasks: any[]) => {
    try {
      window.sessionStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.warn('Failed to save tasks to sessionStorage:', error);
    }
  },
  
  loadTasks: (): any[] => {
    try {
      const stored = window.sessionStorage.getItem(TASKS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load tasks from sessionStorage:', error);
      return [];
    }
  },
  
  saveTimerState: (state: any) => {
    try {
      window.sessionStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save timer state to sessionStorage:', error);
    }
  },
  
  loadTimerState: () => {
    try {
      const stored = window.sessionStorage.getItem(TIMER_STATE_KEY);
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      const timeDiff = Date.now() - state.timestamp;
      
      // If more than 10 minutes have passed, don't restore timer state
      if (timeDiff > 10 * 60 * 1000) {
        return null;
      }
      
      return state;
    } catch (error) {
      console.warn('Failed to load timer state from sessionStorage:', error);
      return null;
    }
  },
  
  clearAll: () => {
    try {
      window.sessionStorage.removeItem(TASKS_STORAGE_KEY);
      window.sessionStorage.removeItem(TIMER_STATE_KEY);
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }
};