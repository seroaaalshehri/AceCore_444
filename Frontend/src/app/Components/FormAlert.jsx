export default function FormAlert({ open, type = "error", message, onClose, side = 'center' }) {
  if (!open) return null;

  // Use CSS classes for horizontal placement to avoid inline-style layout shifts.
  const posClass = side === 'gamer' ? 'fa-left-gamer' : side === 'club' ? 'fa-left-club' : 'fa-center';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`pointer-events-auto max-w-sm w-full mx-4 rounded-lg shadow-lg bg-[#1C1633] border border-gray-600 p-4 flex items-start gap-3 form-alert ${posClass} animate-fadeInOpacity`}
      >
        <span className={`text-xl ${type === "error" ? "text-red-400" : "text-green-400"}`}></span>
        <div className="flex-1 text-sm text-gray-200">{message}</div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✖</button>
      </div>
    </div>
  );
}
