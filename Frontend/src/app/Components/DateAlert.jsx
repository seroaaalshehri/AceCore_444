import React from "react";

export default function DateAlert({ open, message, onClose }) {
  if (!open) return null;

  return (<div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[2147483647]">

  <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
        <p className="text-lg font-bold mb-4 text-red-500">
  Age Restriction
</p>
        <p className="text-sm text-gray-300 mb-6">{message}</p>
        <div className="flex w-full">
          <button
            onClick={onClose}
            className="flex-1 bg-[#5f4a87] hover:bg-[#7a66c7] px-4 py-2 rounded text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}