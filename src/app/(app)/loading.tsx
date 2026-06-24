export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}
