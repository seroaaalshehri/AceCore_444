"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { User } from "lucide-react";

const requests = [
  { id: 1, name: "ROSA", avatar: "https://i.pravatar.cc/100?img=1", details: "username: @rosa" },
  { id: 2, name: "ROSA", avatar: "https://i.pravatar.cc/100?img=2", details: "username: @rosa2" },
];

const reports = [
  { id: 1, title: "Cheating", comment: "GamerX is reported for cheating in a match." },
  { id: 2, title: "Toxic Chat", comment: "Player used abusive language in chat." },
];

export function AdminDashboard() {
  const [accepted, setAccepted] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState(null); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);


  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const handleAccept = (id) => setAccepted((prev) => [...prev, id]);
  const handleUnaccept = (id) => setAccepted((prev) => prev.filter((x) => x !== id));

  return (
    <div className="min-h-screen px-8 py-6 bg-[#0C0817] font-barlow font-bold text-white">
      {/* Cards Container */}
      <div className="flex justify-center mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full max-w-5xl">
          {/* Accept Requests Card */}
          <div className="bg-[#2b2142b3] p-6 rounded-xl shadow-[0_0_6px_#5f4a87,0_0_12px_rgba(95,74,135,0.5)] flex flex-col relative">
            <h2 className="text-2xl text-[#dee1e6] [text-shadow:0_0_2px_#a394c9] mb-2">
              Accept Request
            </h2>
            <div className="h-[2px] w-3/4 bg-[#dee1e6] mb-4 shadow-[0_0_2px_#a394c9]" />

            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="relative">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-[#dee1e6] [text-shadow:0_0_2px_#a394c9] gap-3">
                      <img src={req.avatar} alt={req.name} className="w-8 h-8 rounded-full" />
                      <span>{req.name}</span>
                    </div>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown?.type === "request" && openDropdown.id === req.id
                            ? null
                            : { type: "request", id: req.id }
                        )
                      }
                      className="bg-[#FCCC22] text-[#2b2142b3] font-bold hover:neon-btn-gold px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                  </div>

                  {openDropdown?.type === "request" && openDropdown.id === req.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 mt-2 w-72 bg-[#1C1633] border border-gray-600 rounded-lg shadow-xl p-4 z-50"
                    >
                      <p className="text-sm text-gray-300 mb-4">{req.details}</p>
                      <div className="flex w-full space-x-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="w-1/2 bg-[#4682B4] hover:neon-btn-blue px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUnaccept(req.id)}
                          className="w-1/2 bg-red-500 hover:neon-btn-red px-3 py-1 rounded text-sm"
                        >
                          Unaccept
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Manage Reports Card */}
          <div className="bg-[#2b2142b3] p-6 rounded-xl shadow-[0_0_6px_#5f4a87,0_0_12px_rgba(95,74,135,0.5)] flex flex-col relative">
            <h2 className="text-2xl font-bold text-[#dee1e6] [text-shadow:0_0_2px_#a394c9] mb-2">
              Manage Reports
            </h2>
            <div className="h-[2px] w-3/4 bg-[#dee1e6] mb-4 shadow-[0_0_2px_#a394c9]" />

            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#dee1e6] [text-shadow:0_0_2px_#a394c9]">{rep.title}</p>
                      <p className="text-gray-400 text-sm">{rep.comment}</p>
                    </div>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown?.type === "report" && openDropdown.id === rep.id
                            ? null
                            : { type: "report", id: rep.id }
                        )
                      }
                      className="bg-[#FCCC22] text-[#2b2142b3] font-bold hover:neon-btn-gold px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                  </div>

                  {openDropdown?.type === "report" && openDropdown.id === rep.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 mt-2 w-72 bg-[#1C1633] border border-gray-600 rounded-lg shadow-xl p-4 z-50 " 
                    >
                      <p className="text-sm text-gray-300 mb-4 ">{rep.comment}</p>
                     <div className="flex w-full space-x-2">
                        <button
                          onClick={() => {
                            setConfirmationMessage("Account has been kept.");
                            setOpenDropdown(null);
                          }}
                          className="w-1/2 bg-[#4682B4] hover:neon-btn-blue px-3 py-1 rounded text-sm"
                        >
                          Keep Account
                        </button>
                        <button
                          onClick={() => {
                            setPendingDelete(rep);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-1/2 bg-red-500 hover:neon-btn-red px-3 py-1 rounded text-sm"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && pendingDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to delete this account?</p>
            <p className="text-sm text-gray-300 mb-6">{pendingDelete.comment}</p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmationMessage("Account deleted.");
                  setPendingDelete(null);
                  setOpenDropdown(null);
                }}
                className="w-1/2 bg-red-500  hover:neon-btn-red px-4 py-2 rounded text-sm"
              >
               Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPendingDelete(null);
                  setOpenDropdown(null);
                }}
                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationMessage && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[300px] text-center">
            <p className="text-lg font-bold mb-4">{confirmationMessage}</p>
            <button
              onClick={() => setConfirmationMessage(null)}
              className="mt-2 bg-[#4682B4] hover:neon-btn-blue px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export function AppHeader() {
  const [hovering, setHovering] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  return (
    <>
      <header className="flex justify-between items-start mb-8 bg-[#0C0817] font-barlow p-1 rounded-lg">
    
        <div className="flex flex-col items-start pl-3 mt-4 mr-15">
          <Image
            src="/AC-glow.png"
            alt="Logo"
            width={100}
            height={110}
            className="object-contain"
          />
          <span className="text-5xl font-extrabold tracking-wide mt-9 ml-[225px] [text-shadow:0_0_6px_#a394c9]">
            Hello, Admin
          </span>
        </div>

        {/* RIGHT SIDE: USER ICON + DROPDOWN */}
        <div
          className="relative flex items-center mt-7 mr-10"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="p-3 rounded-full bg-[#1C1633] shadow-[0_0_12px_#5f4a87] cursor-pointer transition">
            <User className="w-6 h-6 text-gray-300" />
          </div>

          {/* Dropdown */}
          {hovering && (
            <div className="absolute top-[105%] right-0 w-40 bg-[#2b2142] rounded-lg shadow-xl p-2 z-50">
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="block w-full text-left px-4 py-2 hover:bg-[#3b2d5e] font-bold rounded text-red-400  "
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sign-Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 flex justify-center items-center font-barlow font-bold bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">
              Are you sure you want to sign out?
            </p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  window.location.href = "/";
                }}
                className="w-1/2 bg-red-500 hover:neon-btn-red px-4 py-2 rounded text-sm"
              >
                Yes
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}