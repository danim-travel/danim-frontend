interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={`max-w-6xl mx-auto px-6 py-8 ${className ?? ''}`}>
        {children}
      </div>
    </div>
  )
}
