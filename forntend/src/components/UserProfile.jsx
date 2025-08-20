export default function UserProfile({ user, isLoading, onLogout }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user.photoBase64}
            alt="Profile"
            className="w-20 h-20 rounded-full border object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-600">
              {user.program} - Sem {user.semester}
            </p>
            <p className="text-sm text-gray-500">{user.department}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-blue-500">{user.points}</div>
          <div className="text-sm text-gray-500">Points</div>
        </div>
        
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          disabled={isLoading}
        >
          {isLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}