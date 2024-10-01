import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './App.css';

const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil'],
  'Passport': ['name', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
  'Diploma': ['name', 'institution', 'degree', 'graduationDate'],
  'Transcript': ['name', 'institution', 'gpa']
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requiredCredentials: []
  });

  useEffect(() => {
    // Simulating fetching jobs from an API
    setJobs([
      {
        id: 1,
        title: 'Software Engineer',
        company: 'Tech Innovations Inc.',
        location: 'San Francisco, CA',
        description: 'We are seeking a talented Software Engineer to join our dynamic team...',
        requiredCredentials: ['UniversityDegree', 'Transcript']
      },
      {
        id: 2,
        title: 'Data Analyst',
        company: 'Data Insights Co.',
        location: 'New York, NY',
        description: 'Join our data team to analyze and interpret complex data sets...',
        requiredCredentials: ['UniversityDegree', 'Transcript']
      },
      {
        id: 3,
        title: 'UX Designer',
        company: 'Creative Solutions Ltd.',
        location: 'London, UK',
        description: 'Were looking for a creative UX Designer to enhance our product experiences...',
        requiredCredentials: ['UniversityDegree', 'Portfolio']
      }
    ]);
  }, []);

  useEffect(() => {
    const checkStatus = setInterval(() => {
      if (qrCodeData) {
        checkVerificationStatus();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkStatus);
  }, [qrCodeData]);

  const generateCredentialRequest = async (job) => {
    setIsLoading(true);
    setError('');
    setSelectedJob(job);

    try {
      const response = await axios.post('http://localhost:3006/generate-request', {
        credentialType: job.requiredCredentials[0] // For simplicity, we're using the first required credential
      });

      setQrCodeData(response.data.request);
      setVerificationResult(null);
    } catch (error) {
      console.error('Error generating credential request:', error);
      setError('Failed to generate credential request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3006/verification-status');
      setVerificationResult(response.data);
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeData)
      .then(() => {
        setCopySuccess('QR Code data copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear the message after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
        setError('Failed to copy QR Code data.');
      });
  };

  const handlePostJob = (e) => {
    e.preventDefault();
    const id = jobs.length + 1;
    setJobs([...jobs, { ...newJob, id }]);
    setShowPostJobForm(false);
    setNewJob({
      title: '',
      company: '',
      location: '',
      description: '',
      requiredCredentials: []
    });
  };

  const renderCredentialSubject = (subject) => {
    return (
      <div className="credential-subject">
        <h3>Credential Subject:</h3>
        {Object.entries(subject).map(([key, value]) => (
          <p key={key}>
            <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        <h1>Job Portal Dashboard</h1>
      </header>
      
      <main>
        <div className="job-header">
          <h2>Job Listings</h2>
          <button onClick={() => setShowPostJobForm(true)}>Post a Job</button>
        </div>

        <div className="job-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.company} - {job.location}</p>
              <p className="job-description">{job.description}</p>
              <div>
                <strong>Required Credentials:</strong>
                <ul>
                  {job.requiredCredentials.map((cred) => (
                    <li key={cred}>{cred}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => generateCredentialRequest(job)}>Apply</button>
            </div>
          ))}
        </div>

        {showPostJobForm && (
          <div className="modal">
            <div className="modal-content">
              <h2>Post a New Job</h2>
              <form onSubmit={handlePostJob}>
                <div>
                  <label htmlFor="title">Job Title</label>
                  <input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="company">Company</label>
                  <input
                    id="company"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="requiredCredentials">Required Credentials</label>
                  <select
                    id="requiredCredentials"
                    multiple
                    value={newJob.requiredCredentials}
                    onChange={(e) => setNewJob({ ...newJob, requiredCredentials: Array.from(e.target.selectedOptions, option => option.value) })}
                    required
                  >
                    {Object.keys(credentialTypes).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <button type="submit">Post Job</button>
                <button type="button" onClick={() => setShowPostJobForm(false)}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        {qrCodeData && (
          <div className="modal">
            <div className="modal-content">
              <h2>Apply for {selectedJob.title}</h2>
              <p>Scan the QR code to submit your credentials</p>
              <div className="qr-code-container">
                <QRCodeSVG value={qrCodeData} size={256} onClick={copyToClipboard} className="qr-code" />
                <p className="qr-code-instruction">Click on the QR code to copy the data</p>
                {copySuccess && <p className="copy-success">{copySuccess}</p>}
              </div>
              {verificationResult && (
                <div className="verification-result">
                  <h3>Verification Result:</h3>
                  {verificationResult.verified ? (
                    <>
                      <p className="success-message">Credential verified successfully!</p>
                      <p><strong>Credential Type:</strong> {verificationResult.credentialType}</p>
                      {renderCredentialSubject(verificationResult.credentialSubject)}
                    </>
                  ) : (
                    <p className="error-message">Verification failed: {verificationResult.error || 'Unknown error'}</p>
                  )}
                </div>
              )}
              <button onClick={() => setQrCodeData('')}>Close</button>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </main>

      <footer>
        <p>© 2024 Job Portal Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;