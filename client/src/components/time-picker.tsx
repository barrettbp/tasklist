import { useState, useEffect, useRef } from "react";

interface TimePickerProps {
  value: number;
  onChange: (value: number) => void;
}

const TIME_OPTIONS = [5, 10, 20, 25, 30, 45, 60];

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    TIME_OPTIONS.indexOf(value) !== -1 ? TIME_OPTIONS.indexOf(value) : 3
  );
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const lastWheelTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelection = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < TIME_OPTIONS.length) {
      setCurrentIndex(newIndex);
      onChange(TIME_OPTIONS[newIndex]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    const threshold = 40; // Increased threshold for slower scrolling
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentIndex < TIME_OPTIONS.length - 1) {
        updateSelection(currentIndex + 1);
        startY.current = currentY;
      } else if (deltaY < 0 && currentIndex > 0) {
        updateSelection(currentIndex - 1);
        startY.current = currentY;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const timeSinceLastWheel = now - lastWheelTime.current;
    
    // Throttle wheel events to 300ms intervals for slower scrolling
    if (timeSinceLastWheel < 300) {
      return;
    }
    
    lastWheelTime.current = now;
    
    // Use a threshold to make wheel scrolling less sensitive
    const threshold = 10;
    if (Math.abs(e.deltaY) > threshold) {
      if (e.deltaY > 0 && currentIndex < TIME_OPTIONS.length - 1) {
        updateSelection(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        updateSelection(currentIndex - 1);
      }
    }
  };

  const handleMouseEnter = () => {
    // Disable body scroll when hovering over time picker
    document.body.style.overflow = 'hidden';
  };

  const handleMouseLeave = () => {
    // Re-enable body scroll when leaving time picker
    document.body.style.overflow = 'unset';
  };

  const handleOptionClick = (index: number) => {
    updateSelection(index);
  };

  // Update selection when value prop changes
  useEffect(() => {
    const index = TIME_OPTIONS.indexOf(value);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [value, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="bg-ios-gray rounded-xl p-4 touch-manipulation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={containerRef}
        className="time-picker-wheel relative cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ userSelect: 'none' }}
      >
        <div
          className="time-picker-options"
          style={{
            transform: `translateY(calc(-50% + ${(currentIndex - 3) * -40}px))`,
          }}
        >
          {TIME_OPTIONS.map((time, index) => (
            <div
              key={time}
              className={`time-option ${index === currentIndex ? 'selected' : ''}`}
              onClick={() => handleOptionClick(index)}
              style={{ cursor: 'pointer' }}
            >
              {time} min
            </div>
          ))}
        </div>
        <div className="picker-overlay" />
        <div className="picker-selector" />
      </div>
    </div>
  );
}
