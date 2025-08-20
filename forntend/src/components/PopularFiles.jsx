import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import PdfPreview from './PdfPreview';

export default function PopularFiles({ csrfToken, user, onDownload }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  useEffect(() => {
    const fetchPopularFiles = async () => {
      try {
        setLoading(true);
        const data = await fileAPI.getPopularFiles(csrfToken);
        setFiles(data);
        setError('');
      } catch (err) {
        setError('Failed to load popular files');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (csrfToken) {
      fetchPopularFiles();
    }
  }, [csrfToken]);
  
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
  
  const handlePreview = (file) => {
    setPreviewFile(file);
  };
  
  if (loading) {
    return <div className="text-center py-10">Loading popular files...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded">
        {error}
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Popular Study Materials</h2>
      
      {downloadError && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {downloadError}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file._id} className="border rounded-lg p-4 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-1">{file.subjectName}</h3>
            <p className="text-sm text-gray-600 mb-2">{file.subjectCode} • Sem {file.semester}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {file.regulation}
              </span>
              <span className="text-xs text-gray-500">
                {file.downloadCount} downloads
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handlePreview(file)}
                className="flex-1 px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                Preview
              </button>
              <button
                onClick={() => handleDownload(file._id, file.originalName)}
                disabled={downloadingId === file._id || user.points < 10}
                className={`flex-1 px-3 py-1 text-xs rounded ${
                  user.points < 10 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {downloadingId === file._id ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
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