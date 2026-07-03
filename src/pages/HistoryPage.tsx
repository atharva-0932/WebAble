import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  ExternalLink, 
  Clock, 
  ChevronRight, 
  ArrowUpDown,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getReports, deleteScans } from '../services/api';

// Define Scan type to match your backend response
type Scan = {
  id: string;
  url: string;
  date: Date;
  accessibility_score: number;
  performance_score?: number;
  best_practices_score?: number;
  seo_score?: number;
  issues_count: number;
  status: 'completed' | 'failed' | 'pending';
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'accessibility_score' | 'url'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch scan history from backend
  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getReports(50, 0);
      
      // Transform the data to match our Scan type
      const rawScans = data as unknown as Array<{
        id?: string;
        _id?: string;
        url: string;
        date: string;
        results?: {
          score?: number;
          metrics?: {
            accessibility?: number;
            performance?: number;
            bestPractices?: number;
            seo?: number;
          };
          issues?: unknown[];
        };
        status?: 'completed' | 'failed' | 'pending';
      }>;
      const transformedData: Scan[] = rawScans.map((scan) => ({
        id: scan.id || scan._id,
        url: scan.url,
        // Parse date as-is (assume backend returns UTC ISO string)
        date: new Date(scan.date),
        accessibility_score: scan.results?.score || scan.results?.metrics?.accessibility || 0,
        performance_score: scan.results?.metrics?.performance,
        best_practices_score: scan.results?.metrics?.bestPractices,
        seo_score: scan.results?.metrics?.seo,
        issues_count: scan.results?.issues?.length || 0,
        status: scan.status || 'completed'
      }));
      
      setScanHistory(transformedData);
    } catch (err) {
      console.error('Error fetching scan history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  // Delete scans from backend
  const deleteScansFromBackend = async (scanIds: string[]) => {
    try {
      await deleteScans(scanIds);
      return true;
    } catch (err) {
      console.error('Error deleting scans:', err);
      return false;
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchScanHistory();
  }, []);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 75) return 'text-blue-700 bg-blue-100';
    if (score >= 50) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Toggle sort order
  const toggleSort = (key: 'date' | 'accessibility_score' | 'url') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Handle scan selection
  const toggleScanSelection = (id: string) => {
    setSelectedScans(prev => 
      prev.includes(id) 
        ? prev.filter(scanId => scanId !== id)
        : [...prev, id]
    );
  };

  // Select all scans
  const toggleSelectAll = () => {
    if (selectedScans.length === filteredAndSortedScans.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(filteredAndSortedScans.map(scan => scan.id));
    }
  };

  // Delete selected scans
  const deleteSelectedScans = async () => {
    const success = await deleteScansFromBackend(selectedScans);
    
    if (success) {
      // Remove from local state
      setScanHistory(prev => prev.filter(scan => !selectedScans.includes(scan.id)));
      setSelectedScans([]);
      setSuccessMessage('Selected scans deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      // If backend deletion fails, still remove from local state
      setScanHistory(prev => prev.filter(scan => !selectedScans.includes(scan.id)));
      setSelectedScans([]);
      
      // Show error message
      setError('Some scans may not have been deleted from the server');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Filter scans
  const filteredScans = searchTerm
    ? scanHistory.filter(scan => 
        scan.url.toLowerCase().includes(searchTerm.toLowerCase()))
    : scanHistory;

  // Sort scans
  const filteredAndSortedScans = [...filteredScans].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime();
    } else if (sortBy === 'accessibility_score') {
      return sortOrder === 'asc' 
        ? a.accessibility_score - b.accessibility_score
        : b.accessibility_score - a.accessibility_score;
    } else {
      return sortOrder === 'asc' 
        ? a.url.localeCompare(b.url)
        : b.url.localeCompare(a.url);
    }
  });

  const getSortIcon = (key: 'date' | 'accessibility_score' | 'url') => {
    if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ChevronRight className="h-4 w-4 text-gray-900 rotate-90" />
      : <ChevronRight className="h-4 w-4 text-gray-900 -rotate-90" />;
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchScanHistory();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          <button className="btn btn-primary" disabled>
            New Scan
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success popup */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-300 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center">
          <span className="font-medium">{successMessage}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/scan')}
          >
            New Scan
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800  rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-64"
                placeholder="Search by URL..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedScans.length > 0 && (
                <button 
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  onClick={deleteSelectedScans}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedScans.length})
                </button>
              )}
            </div>
          </div>
        </div>
        
        {filteredAndSortedScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={selectedScans.length === filteredAndSortedScans.length && filteredAndSortedScans.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('url')}
                  >
                    <div className="flex items-center">
                      <span>URL</span>
                      <span className="ml-1">{getSortIcon('url')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      <span>Date</span>
                      <span className="ml-1">{getSortIcon('date')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('accessibility_score')}
                  >
                    <div className="flex items-center">
                      <span>Accessibility Score</span>
                      <span className="ml-1">{getSortIcon('accessibility_score')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">Issues</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedScans.map((scan) => (
                  <motion.tr 
                    key={scan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={selectedScans.includes(scan.id)}
                        onChange={() => toggleScanSelection(scan.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {scan.url}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {scan.date.toLocaleString('en-IN', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center justify-center rounded-full ${getScoreColor(scan.accessibility_score)} px-2 py-1 min-w-[2rem]`}>
                        <span className="text-xs font-medium">{scan.accessibility_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {scan.issues_count} {scan.issues_count === 1 ? 'issue' : 'issues'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                        scan.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        onClick={() => navigate(`/report/${scan.id}`)}
                      >
                        View Report
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <ExternalLink className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No scans found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm ? `No results found for "${searchTerm}"` : "You haven't performed any scans yet."}
            </p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={() => navigate('/scan')}
            >
              Start scanning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;