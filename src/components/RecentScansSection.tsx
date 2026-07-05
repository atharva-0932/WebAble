import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock, ArrowUpRight, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from "date-fns";
import { getRecentScans } from '../services/api';

type Scan = {
  _id: string;
  url: string;
  date: string;
  score: number;
};

const RecentScansSection = () => {
  const navigate = useNavigate();
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  useEffect(() => {
    const fetchRecentScans = async () => {
      try {
        const data = await getRecentScans(5);
        setRecentScans(data as unknown as Scan[]);
      } catch (err) {
        console.error("Error fetching recent scans:", err);
        // You can add toast notification here
        setRecentScans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentScans();
  }, []);

  const handleScanClick = (scan: Scan) => {
    // Navigate to report page with scan ID and URL as query parameters
    navigate(`/report/${scan._id}?url=${encodeURIComponent(scan.url)}`);
  };

  const handleNewScan = () => {
    navigate('/scan');
  };

  // Helper to safely format scan date
  const getRelativeTime = (dateStr: string) => {
    try {
      if (!dateStr) return "Unknown";
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Unknown";
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
      return "Unknown";
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Scans</h2>
        <button 
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
          onClick={() => navigate('/history')}
        >
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 ml-3">Loading recent scans...</p>
        </div>
      ) : recentScans.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-gray-800  shadow-sm">
          <ul className="divide-y divide-gray-200">
            {recentScans.slice(0, 3).map((scan) => (
              <li key={scan._id}>
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 text-left"
                  onClick={() => handleScanClick(scan)}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 truncate w-full" title={scan.url}>
                        {scan.url}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        <span>
                          {getRelativeTime(scan.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center ml-4">
                    <div className={`flex items-center justify-center rounded-full ${getScoreColor(scan.score)} h-8 w-8 mr-2`}>
                      <span className="text-xs font-medium">{scan.score}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white dark:bg-gray-800  p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-600 mb-4">
            <ExternalLink className="h-6 w-6 text-gray-400 dark:text-gray-300" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No recent scans found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Start by analyzing a website to see your scan history here.</p>
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
            onClick={handleNewScan}
          >
            Start New Scan
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentScansSection;