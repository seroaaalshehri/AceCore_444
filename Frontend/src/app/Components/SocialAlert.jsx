export default function SocialAlert({ open, platform, value, onChange, onSave, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">
      <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
        <p className="text-lg font-bold mb-4 text-[#FCCC22]">
          Enter {platform} Link
        </p>

        <input
          type="url"
          placeholder={`Paste your ${platform} link here`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 rounded-md bg-[#2b2142] text-white text-sm focus:outline-none mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
