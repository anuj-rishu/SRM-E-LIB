import { useState } from "react";
import { authAPI, fileAPI } from "./services/api";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import LoginForm from "./components/LoginForm";
import UserProfile from "./components/UserProfile";
import NavTabs from "./components/NavTabs";
import ProfileDetails from "./components/ProfileDetails";
import PopularFiles from "./components/PopularFiles";

export default function App() {
  const [csrfToken, setCsrfToken] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  const handleLoginSuccess = (token, userData) => {
    setCsrfToken(token);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      if (csrfToken) {
        await authAPI.logout(csrfToken);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setCsrfToken("");
      setIsLoading(false);
    }
  };

  const refreshUserPoints = async () => {
    if (!user || !user.regNumber || !csrfToken) return;
    
    try {
      const pointsData = await fileAPI.getUserPoints(user.regNumber, csrfToken);
      setUser(prev => ({ ...prev, points: pointsData.points }));
    } catch (err) {
      console.error("Failed to refresh user points:", err);
    }
  };

  const handleFileUploaded = (newPoints) => {
    setUser(prev => ({ ...prev, points: newPoints }));
    setFileRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!user ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <UserProfile 
            user={user} 
            isLoading={isLoading} 
            onLogout={handleLogout} 
          />
          
          <NavTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'upload', label: 'Upload Materials' },
              { id: 'files', label: 'Download Materials' },
              { id: 'favorites', label: 'My Favorites' },
              { id: 'popular', label: 'Popular' }
            ]}
          />
          
          {activeTab === 'profile' && <ProfileDetails user={user} />}
          
          {activeTab === 'upload' && (
            <FileUpload 
              csrfToken={csrfToken} 
              user={user} 
              onUploadSuccess={handleFileUploaded}
            />
          )}
          
          {activeTab === 'files' && (
            <FileList 
              csrfToken={csrfToken} 
              user={user} 
              onDownload={refreshUserPoints}
              refreshTrigger={fileRefreshTrigger}
            />
          )}
          
          {activeTab === 'favorites' && (
            <FileList 
              csrfToken={csrfToken} 
              user={user} 
              onDownload={refreshUserPoints}
              refreshTrigger={fileRefreshTrigger}
              favoritesOnly={true}
            />
          )}
          
          {activeTab === 'popular' && (
            <PopularFiles
              csrfToken={csrfToken}
              user={user}
              onDownload={refreshUserPoints}
            />
          )}
        </div>
      )}
    </div>
  );
}