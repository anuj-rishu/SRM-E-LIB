export default function ProfileDetails({ user }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-4 text-lg">Personal Details</h3>
          <div className="space-y-2">
            <p><span className="font-semibold">Reg No:</span> {user.regNumber}</p>
            <p><span className="font-semibold">Mobile:</span> {user.mobile}</p>
            <p><span className="font-semibold">Year:</span> {user.year}</p>
            <p><span className="font-semibold">Section:</span> {user.section}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-lg">Advisors</h3>
          <ul className="space-y-4">
            {user.advisors &&
              user.advisors.map((advisor, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  <span className="font-bold">{advisor.role}:</span>{" "}
                  {advisor.name}
                  <br />
                  <span className="text-blue-500">
                    {advisor.email}
                  </span> | {advisor.phone}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}