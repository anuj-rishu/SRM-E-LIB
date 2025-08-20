import { useState } from 'react';
import { fileAPI } from '../services/api';

export default function FileUpload({ csrfToken, user, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [semester, setSemester] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [regulation, setRegulation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      setFile(null);
    } else {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    
    if (!semester || !subjectCode || !subjectName || !regulation) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fileAPI.uploadFile(
        {
          file,
          semester,
          subjectCode,
          subjectName,
          regulation
        },
        csrfToken,
        user.regNumber
      );
      
      setSuccess('File uploaded successfully! You earned 20 points.');
      setFile(null);
      setSemester('');
      setSubjectCode('');
      setSubjectName('');
      setRegulation('');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.points);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Upload Study Material</h2>
      <p className="text-sm text-gray-600 mb-4">
        Share your study materials with others and earn 20 points per upload.
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">File (PDF only)</label>
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
            disabled={loading}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-1">Semester</label>
            <input 
              type="number" 
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Enter semester number"
              min="1"
              max="8"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Subject Code</label>
            <input 
              type="text" 
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. CS1001"
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Subject Name</label>
          <input 
            type="text" 
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g. Introduction to Programming"
            disabled={loading}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Regulation</label>
          <input 
            type="text" 
            value={regulation}
            onChange={(e) => setRegulation(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g. 2021"
            disabled={loading}
            required
          />
        </div>
        
        <button 
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
}