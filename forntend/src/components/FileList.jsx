import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import PdfPreview from './PdfPreview';

export default function FileList({ csrfToken, user, onDownload, refreshTrigger, favoritesOnly = false }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      if (favoritesOnly) {
        // If in favorites mode, get only favorite files
        const data = await fileAPI.getFavorites(user.regNumber, csrfToken);
        setFiles(data);
      } else {
        // Normal mode - get all files and mark favorites
        const data = await fileAPI.getFiles(csrfToken);
        setFiles(data);
        
        // Fetch favorites to mark them in the UI
        const favoritesData = await fileAPI.getFavorites(user.regNumber, csrfToken);
        setFavorites(favoritesData.map(f => f._id));
      }
      
      setError('');
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch files when component mounts or when csrfToken changes
  useEffect(() => {
    if (csrfToken) {
      fetchFiles();
    }
  }, [csrfToken, refreshTrigger, favoritesOnly]); // Add favoritesOnly as dependency

  const handleDownload = async (fileId, fileName) => {
    setDownloadingId(fileId);
    setDownloadError('');
    
    try {
      const blob = await fileAPI.downloadFile(fileId, user.regNumber, csrfToken);
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      
      if (onDownload) {
        // Refresh user points after download
        onDownload();
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setDownloadError('Not enough points to download this file');
      } else {
        setDownloadError('Failed to download file');
      }
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };
  
  const handleToggleFavorite = async (fileId) => {
    try {
      const result = await fileAPI.toggleFavorite(fileId, user.regNumber, csrfToken);
      
      if (favoritesOnly) {
        // If in favorites mode, refresh the list after toggling
        fetchFiles();
      } else {
        // Just update the favorites array in normal mode
        if (result.isFavorite) {
          setFavorites(prev => [...prev, fileId]);
        } else {
          setFavorites(prev => prev.filter(id => id !== fileId));
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };
  
  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  if (loading) {
    return <div className="text-center py-10">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded text-center">
        <p className="text-gray-600">
          {favoritesOnly 
            ? "You don't have any favorite files yet." 
            : "No files have been uploaded yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        {favoritesOnly ? "My Favorite Study Materials" : "Available Study Materials"}
      </h2>
      
      {downloadError && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {downloadError}
        </div>
      )}
      
      <p className="text-sm text-gray-600 mb-4">
        Download costs 10 points per file. You currently have {user.points} points.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sem</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regulation</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downloads</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{file.subjectName}</td>
                <td className="px-4 py-3 text-sm">{file.subjectCode}</td>
                <td className="px-4 py-3 text-sm">{file.semester}</td>
                <td className="px-4 py-3 text-sm">{file.regulation}</td>
                <td className="px-4 py-3 text-sm">{file.uploadedByName}</td>
                <td className="px-4 py-3 text-sm">{file.downloadCount}</td>
                <td className="px-4 py-3 text-sm text-right flex gap-2 justify-end">
                  <button
                    onClick={() => handleToggleFavorite(file._id)}
                    className="p-1 text-sm rounded"
                    title={favorites.includes(file._id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <span className={favorites.includes(file._id) ? "text-yellow-500" : "text-gray-400"}>★</span>
                  </button>
                  
                  <button
                    onClick={() => handlePreview(file)}
                    className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Preview
                  </button>
                  
                  <button
                    onClick={() => handleDownload(file._id, file.originalName)}
                    disabled={downloadingId === file._id || user.points < 10}
                    className={`px-3 py-1 text-xs rounded ${
                      user.points < 10 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {downloadingId === file._id ? 'Downloading...' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {previewFile && (
        <PdfPreview
          fileId={previewFile._id}
          fileName={previewFile.originalName}
          onClose={() => setPreviewFile(null)}
          csrfToken={csrfToken}
          user={user}
        />
      )}
    </div>
  );
}