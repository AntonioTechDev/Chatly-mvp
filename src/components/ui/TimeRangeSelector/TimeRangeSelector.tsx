import React from 'react'
import './TimeRangeSelector.css'

export type TimeRange = '7d' | '1m' | '3m' | '6m' | '1y'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Giorni' },
  { value: '1m', label: '1 Mese' },
  { value: '3m', label: '3 Mesi' },
  { value: '6m', label: '6 Mesi' },
  { value: '1y', label: '1 Anno' },
]

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="time-range-selector">
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`time-range-button ${value === option.value ? 'active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
