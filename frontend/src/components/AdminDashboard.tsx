import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { UserInfo } from '../types';

export const AdminDashboard: React.FC = () => {
  const [licenses, setLicenses] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    checkServerHealth();
    loadLicenses();
  }, []);

  const checkServerHealth = async () => {
    try {
      const health = await apiService.checkServerHealth();
      setServerHealth(health.message);
    } catch (error) {
      setServerHealth('Server connection failed');
    }
  };

  const loadLicenses = async () => {
    // Note: getAllLicenses endpoint doesn't exist in backend
    // This would need to be implemented on the backend first
    setLicenses([]);
    console.log('getAllLicenses endpoint not available in backend');
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    try {
      const userInfo = await apiService.getUserInfo(searchEmail.trim());
      setSelectedUser(userInfo);
    } catch (error) {
      console.error('User not found:', error);
      setSelectedUser(null);
      alert('User not found');
    } finally {
      setLoading(false);
    }
  };

  const updateUserApiKey = async () => {
    if (!selectedUser || !newApiKey.trim()) return;

    setUpdateLoading(true);
    try {
      await apiService.updateApiKey({
        email: selectedUser.email,
        new_api_key: newApiKey.trim()
      });
      
      // Refresh user info
      const updatedUser = await apiService.getUserInfo(selectedUser.email);
      setSelectedUser(updatedUser);
      setNewApiKey('');
      alert('API key updated successfully!');
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('Failed to update API key');
    } finally {
      setUpdateLoading(false);
    }
  };

  const createLicenseForUser = async () => {
    if (!selectedUser) return;

    setUpdateLoading(true);
    try {
      // Use sendLicenseEmail which will create a license key if it doesn't exist
      const response = await apiService.sendLicenseEmail({ email: selectedUser.email });
      
      // Refresh user info
      const updatedUser = await apiService.getUserInfo(selectedUser.email);
      setSelectedUser(updatedUser);
      alert(`License key created and sent: ${response.license_key}`);
    } catch (error) {
      console.error('Failed to create license:', error);
      alert('Failed to create license key');
    } finally {
      setUpdateLoading(false);
    }
  };

  const sendLicenseEmail = async () => {
    if (!selectedUser) return;

    setUpdateLoading(true);
    try {
      const response = await apiService.sendLicenseEmail({ email: selectedUser.email });
      alert(`License email sent! Key: ${response.license_key}`);
    } catch (error) {
      console.error('Failed to send license email:', error);
      alert('Failed to send license email');
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteUser = async () => {
    alert('Delete user functionality not available - endpoint not implemented in backend');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[24px] shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-[#5B67E8] mb-4">VisionPay Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                serverHealth.includes('running') ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">Server Status: {serverHealth}</span>
            </div>
            <button
              onClick={loadLicenses}
              disabled={loading}
              className="px-4 py-2 bg-[#5B67E8] text-white rounded-lg text-sm hover:bg-[#4A56D8] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Search & Management */}
          <div className="bg-white rounded-[24px] shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Management</h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter user email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#5B67E8] text-center"
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                />
                <button
                  onClick={searchUser}
                  disabled={loading}
                  className="px-4 py-2 bg-[#5B67E8] text-white rounded-lg text-sm hover:bg-[#4A56D8] disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">User Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="text-gray-600">Name:</div>
                  <div>{selectedUser.first_name} {selectedUser.last_name}</div>
                  <div className="text-gray-600">Email:</div>
                  <div className="break-all">{selectedUser.email}</div>
                  <div className="text-gray-600">Company:</div>
                  <div>{selectedUser.company_name}</div>
                  <div className="text-gray-600">License:</div>
                  <div className="break-all">{selectedUser.license_code || 'None'}</div>
                  <div className="text-gray-600">Created:</div>
                  <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
                </div>

                {/* API Key Update */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update API Key:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="Enter new API key"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#5B67E8] text-center"
                    />
                    <button
                      onClick={updateUserApiKey}
                      disabled={updateLoading || !newApiKey.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={createLicenseForUser}
                    disabled={updateLoading}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                  >
                    Create License
                  </button>
                  <button
                    onClick={sendLicenseEmail}
                    disabled={updateLoading}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={deleteUser}
                    disabled={updateLoading}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* All Licenses */}
          <div className="bg-white rounded-[24px] shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              All Licenses ({licenses.length})
            </h2>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : licenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No licenses found</div>
              ) : (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <div
                      key={license.id}
                      className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedUser(license)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">
                            {license.first_name} {license.last_name}
                          </div>
                          <div className="text-xs text-gray-600">{license.email}</div>
                          <div className="text-xs text-gray-500">{license.company_name}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded ${
                            license.license_code 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {license.license_code ? 'Licensed' : 'No License'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">© 2025 VisionPay Admin Dashboard</p>
        </div>
      </div>
    </div>
  );
}; 