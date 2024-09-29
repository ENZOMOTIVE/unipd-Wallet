import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Issuer.css';

const local_server = "http://localhost:3001";

const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil'],
  'Passport': ['name', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
  'Diploma': ['name', 'institution', 'degree', 'graduationDate'],
  'Transcript': ['name', 'institution', 'gpa']
};

export default function Issuer() {
  const [userId, setUserId] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [credentialFields, setCredentialFields] = useState({});
  const [courses, setCourses] = useState([{ name: '', grade: '' }]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:3001');

    wsRef.current.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs((prevLogs) => [...prevLogs, log]);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (credentialType) {
      const initialFields = credentialTypes[credentialType].reduce((acc, field) => {
        acc[field] = '';
        return acc;
      }, {});
      setCredentialFields(initialFields);
    }
  }, [credentialType]);

  const handleFieldChange = (field, value) => {
    setCredentialFields(prev => ({ ...prev, [field]: value }));
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { name: '', grade: '' }]);
  };

  const removeCourse = (index) => {
    const newCourses = courses.filter((_, i) => i !== index);
    setCourses(newCourses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let submissionData = {
        userId,
        credentialType,
        credentialFields: { ...credentialFields }
      };

      if (credentialType === 'Transcript') {
        submissionData.credentialFields.courses = JSON.stringify(courses);
      }

      const response = await axios.post(`${local_server}/create-offer`, submissionData);
      if (response.data.qrCodeUrl) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setError(null);
      } else {
        throw new Error('QR code URL not received');
      }
    } catch (error) {
      console.error('Error creating credential offer:', error);
      setError(error.response?.data?.error || 'Failed to create credential offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="issuer-container">
      <div className="issuer-card">
        <h1 className="issuer-title">Credential Issuer</h1>
        <form onSubmit={handleSubmit} className="issuer-form">
          <div className="form-group">
            <label htmlFor="userId">User ID:</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="credentialType">Credential Type:</label>
            <select
              id="credentialType"
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              required
            >
              <option value="">Select a type</option>
              {Object.keys(credentialTypes).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {credentialType && (
            <div className="dynamic-fields">
              {credentialTypes[credentialType].map(field => (
                <div key={field} className="form-group">
                  <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                  <input
                    type="text"
                    id={field}
                    value={credentialFields[field]}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    required
                  />
                </div>
              ))}
              {credentialType === 'Transcript' && (
                <div className="courses-section">
                  <h3>Courses</h3>
                  {courses.map((course, index) => (
                    <div key={index} className="course-entry">
                      <input
                        type="text"
                        placeholder="Course Name"
                        value={course.name}
                        onChange={(e) => handleCourseChange(index, 'name', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Grade"
                        value={course.grade}
                        onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => removeCourse(index)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={addCourse}>Add Course</button>
                </div>
              )}
            </div>
          )}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Credential Offer'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {qrCodeUrl && (
          <div className="qr-code-container">
            <h2>Scan this QR Code with your wallet app:</h2>
            <img src={qrCodeUrl} alt="Credential Offer QR Code" className="qr-code" />
          </div>
        )}
      </div>
      <div className="logs-container">
        <h2>Backend Logs</h2>
        <div className="logs-content">
          {logs.map((log, index) => (
            <p key={index}>{`${log.timestamp}: ${log.message}`}</p>
          ))}
        </div>
      </div>
    </div>
  );
}