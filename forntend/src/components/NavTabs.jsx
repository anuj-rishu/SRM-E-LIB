export default function NavTabs({ activeTab, setActiveTab, tabs }) {
  // If tabs are not provided, use default tabs
  const navigationTabs = tabs || [
    { id: 'profile', label: 'Profile' },
    { id: 'upload', label: 'Upload Materials' },
    { id: 'files', label: 'Download Materials' },
    { id: 'favorites', label: 'My Favorites' },
    { id: 'popular', label: 'Popular' }
  ];

  return (
    <div className="flex border-b mb-6 overflow-x-auto">
      {navigationTabs.map(tab => (
        <button 
          key={tab.id}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === tab.id 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}