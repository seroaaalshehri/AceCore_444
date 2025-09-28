
export default function FormAlert({ open, type = "error", message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm rounded-lg shadow-lg 
                    bg-[#1C1633] border border-gray-600 p-4 flex items-start gap-3 animate-fadeIn">
      <span className={`text-xl ${type === "error" ? "text-red-400" : "text-green-400"}`}>
    
      </span>
      <div className="flex-1 text-sm text-gray-200">{message}</div>
      <button onClick={onClose} className="text-gray-400 hover:text-white">✖</button>
    </div>
  );
}
