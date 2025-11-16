interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  className?: string
}

export default function LoadingSpinner({
  size = 'medium',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-16 w-16'
  }

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-blue-400 border-t-transparent ${sizeClasses[size]}`}
      ></div>
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-400`}>
          {text}
        </span>
      )}
    </div>
  )
}