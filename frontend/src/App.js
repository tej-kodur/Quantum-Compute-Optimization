import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import axios from 'axios';

// Base API URL - change this if your backend is hosted elsewhere
const API_BASE_URL = 'http://localhost:8000';

// Main App Component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/optimize" element={<Optimization />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/predictions" element={<Predictions />} />
          </Routes>
        </main>
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

// Navigation Component
function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07l14.14-14.14" />
            </svg>
            <span className="font-bold text-xl">TeraOps</span>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <NavLink to="/" className={({isActive}) => 
                isActive ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800" : 
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
              }>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" className={({isActive}) => 
                isActive ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800" : 
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
              }>
                Analytics
              </NavLink>
              <NavLink to="/optimize" className={({isActive}) => 
                isActive ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800" : 
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
              }>
                Optimization
              </NavLink>
              <NavLink to="/predictions" className={({isActive}) => 
                isActive ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800" : 
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
              }>
                30 day Prediction
              </NavLink>
              <NavLink to="/chat" className={({isActive}) => 
                isActive ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800" : 
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
              }>
                Chat Assistant
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Dashboard Component
function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_URL = "http://localhost:9000";

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/summary`);
        setSummary(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch summary data');
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quantum Computing Resource Dashboard</h1>
      
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total QPU Blocks" 
            value={summary.total_blocks} 
            icon="cube" 
            color="blue"
          />
          <MetricCard 
            title="Total Workloads" 
            value={summary.total_workloads.toLocaleString()} 
            icon="lightning-bolt" 
            color="indigo"
          />
          <MetricCard 
            title="Avg. Daily Cost" 
            value={`$${(summary.average_cost_per_day/10000000).toFixed(2)}`} 
            icon="currency-dollar" 
            color="green"
          />
          <MetricCard 
            title="Cost Savings" 
            value={`${summary.cost_savings_percentage.toFixed(1)}%`} 
            icon="trending-down" 
            color="emerald"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Costs" endpoint={`${API_BASE_URL}/api/chart/daily-costs?start_date=2025-04-01`} />
        <ChartCard title="Block Utilization" endpoint={`${API_BASE_URL}/api/chart/block-utilization?block_type=all&start_date=2025-04-01`} />
      </div>

      {summary && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resource Allocation</h2>
          <div className="flex flex-wrap">
            <BlockTypePieChart blocks={summary.blocks_by_type} />
            <div className="md:w-1/2 mt-4 md:mt-0">
              <h3 className="text-lg font-medium mb-2 ml-3">Optimization Recommendation</h3>
              <p className="text-gray-700 ml-3">{summary.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Component
function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [blockType, setBlockType] = useState('all');

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const API_URL = "http://localhost:9000";

  // Construct chart endpoints with query parameters
  const blockUtilEndpoint = `${API_BASE_URL}/api/chart/block-utilization?block_type=${blockType}${dateRange.startDate ? `&start_date=${dateRange.startDate}` : ''}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;
  
  const costEndpoint = `${API_BASE_URL}/api/chart/daily-costs${dateRange.startDate ? `?start_date=${dateRange.startDate}` : '?'}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quantum Resource Analytics</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Block Type
            </label>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="Atom">Atom</option>
              <option value="Photon">Photon</option>
              <option value="Spin">Spin</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard title="Block Utilization by Type" endpoint={blockUtilEndpoint} />
        <ChartCard title="Cost Efficiency Analysis" endpoint={costEndpoint} />
      </div>
    </div>
  );
}

// Optimization Component
function Optimization() {
  const API_URL = "http://localhost:9000";
  const [strategy, setStrategy] = useState('cost_efficiency');
  const [parameters, setParameters] = useState({
    workload_threshold: 50,
    max_blocks: 100
  });
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleParamChange = (e) => {
    setParameters({
      ...parameters,
      [e.target.name]: Number(e.target.value)
    });
  };

  const startOptimization = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/optimize`, {
        strategy,
        parameters
      });
      setStatus(response.data);
      checkStatus();
    } catch (err) {
      console.error("Optimization error:", err);
      setStatus({ message: "Error starting optimization", status: "error" });
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/optimization/status`);
      setStatus(response.data);
      
      if (response.data.status === "completed") {
        fetchResults();
      } else if (response.data.status === "processing") {
        setTimeout(checkStatus, 2000); // Poll every 2 seconds
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Status check error:", err);
      setStatus({ message: "Error checking status", status: "error" });
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/optimization/results`);
      setResults(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Results fetch error:", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">QPU Block Optimization</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block mb-4">
              <span className="text-gray-700">Workload Threshold</span>
              <input
                type="number"
                name="workload_threshold"
                value={parameters.workload_threshold}
                onChange={handleParamChange}
                className="mt-1 block w-full border-gray-300 rounded-md"
              />
            </label>
            <label className="block mb-6">
              <span className="text-gray-700">Max Blocks</span>
              <input
                type="number"
                name="max_blocks"
                value={parameters.max_blocks}
                onChange={handleParamChange}
                className="mt-1 block w-full border-gray-300 rounded-md"
              />
            </label>
            <button 
              onClick={startOptimization}
              disabled={loading}
              className={`w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 
                          ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Run Optimization'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {status && (
            <div className={`mb-6 p-4 rounded-md 
                ${status.status === 'error' ? 'bg-red-100 text-red-700' 
                  : status.status === 'completed' ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {status.status === 'error' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : status.status === 'completed' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {status.status === 'processing' ? 'Optimization in progress...' : status.message}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <h2 className="text-xl font-semibold">Optimization Results</h2>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Metric label="Blocks Analyzed" value={results.total_blocks_analyzed} />
                <Metric label="Transfers Recommended" value={results.transfers_recommended} />
                <Metric 
                  label="Current Avg Daily Cost" 
                  value={`$${results.current_avg_daily_cost.toLocaleString(undefined, {maximumFractionDigits:2})}`} 
                />
                <Metric 
                  label="Expected Avg Daily Cost" 
                  value={`$${results.expected_avg_daily_cost.toLocaleString(undefined, {maximumFractionDigits:2})}`} 
                />
                <Metric 
                  label="Expected Monthly Savings" 
                  value={`$${results.expected_monthly_savings.toLocaleString(undefined, {maximumFractionDigits:2})}`} 
                />
                <Metric 
                  label="Improvement" 
                  value={`${results.percentage_improvement.toFixed(2)}%`} 
                />
              </div>

              {/* Distribution Changes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DistributionChart 
                  title="Before Optimization" 
                  distribution={results.current_distribution} 
                />
                <DistributionChart 
                  title="After Optimization" 
                  distribution={results.optimized_distribution} 
                />
              </div>

              {/* Detailed Transfer Recommendations */}
              <div>
                <h3 className="font-medium mb-2">Transfer Recommendations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          'Block ID',
                          'From',
                          'To',
                          'Size',
                          'Avg Daily Workloads',
                          '30d Savings',
                          'Break-even (days)'
                        ].map((h) => (
                          <th 
                            key={h}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.recommended_transfers.map((t) => (
                        <tr key={t.block_id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{t.block_id}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{t.current_category}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{t.recommended_category}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {(t.size / (1024**2)).toFixed(2)} MB
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {t.avg_daily_workloads.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            ${(t.expected_savings_30d / 10000000).toLocaleString(undefined, {maximumFractionDigits:2})}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {t.days_to_break_even.toExponential(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for summary metrics
function Metric({ label, value }) {
  return (
    <div className="p-4 bg-indigo-50 rounded-md">
      <div className="text-sm text-indigo-800">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

// Simple bar-chart-like distribution display
function DistributionChart({ title, distribution }) {
  return (
    <div className="p-4 bg-green-50 rounded-md">
      <h4 className="font-medium text-green-800 mb-2">{title}</h4>
      {Object.entries(distribution).map(([category, count]) => (
        <div key={category} className="flex justify-between text-sm mb-1">
          <span>{category}</span>
          <span>{count}</span>
        </div>
      ))}
    </div>
  );
}

// Chat Assistant Component
function ChatAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your TeraOps Quantum Computing Assistant. How can I help you optimize your quantum computing resources today?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and show loading
    setQuery('');
    setLoading(true);

    try {
      // Updated to match the API endpoint's expected format
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { 
        message: query,
        thread_id: threadId
      });
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }]);

      // Store the thread_id for continued conversation
      if (response.data.thread_id) {
        setThreadId(response.data.thread_id);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, but I encountered an error processing your request. Please try again later."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quantum Computing Assistant</h1>
      
      <div className="bg-white rounded-lg shadow-md flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`max-w-3xl mx-2 my-2 p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'ml-auto bg-indigo-100 text-gray-800' 
                  : 'mr-auto bg-gray-100 text-gray-800'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 p-3">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
                <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
                <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-500">Assistant is thinking...</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about quantum computing resources, optimization strategies, or data analysis..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2">
            Example: "How can I optimize my quantum blocks for cost efficiency?" or "Show me a chart of block utilization over time"
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
// Updated ChartCard Component that handles base64 images
function ChartCard({ title, endpoint }) {
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the base64 string from the response
        if (data.image) {
          // Remove the "data:image/png;base64," prefix if it exists
          const base64String = data.image.includes('base64,') 
            ? data.image.split('base64,')[1] 
            : data.image;
          
          setImageData(base64String);
        } else {
          throw new Error('Image data not found in response');
        }
      } catch (err) {
        console.error('Failed to fetch chart:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [endpoint]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">Error loading chart: {error}</div>
        ) : imageData ? (
          <img 
            src={`data:image/png;base64,${imageData}`}
            alt={`${title} Chart`} 
            className="w-full h-auto"
          />
        ) : (
          <div className="text-gray-500 p-4">No chart data available</div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    indigo: "bg-indigo-100 text-indigo-800",
    green: "bg-green-100 text-green-800",
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {icon === 'cube' && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )}
          {icon === 'lightning-bolt' && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {icon === 'currency-dollar' && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {icon === 'trending-down' && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Predictions() {
  const [data, setData] = useState([]);
  const [optimizedData, setOptimizedData] = useState([]);
  const [chartImage, setChartImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartError, setChartError] = useState(null);
  const [page, setPage] = useState(0);
  const [optPage, setOptPage] = useState(0);
  const ROWS_PER_PAGE = 5;
  const API_URL = "http://localhost:9000";
  
  // Fetch tables data
  useEffect(() => {
    async function fetchData() {
      try {
        const [predRes, optRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/predictions`),
          fetch(`${API_BASE_URL}/api/optimized_predictions`)
        ]);
        if (!predRes.ok) throw new Error(`Predictions status ${predRes.status}`);
        if (!optRes.ok)  throw new Error(`Optimized status ${optRes.status}`);
        const predJson = await predRes.json();
        const optJson  = await optRes.json();
        setData(predJson.predictions || []);
        setOptimizedData(optJson.optimized_predictions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch chart image
  useEffect(() => {
    async function fetchChart() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chart/predictions?days=30`);
        if (!res.ok) throw new Error(`Chart status ${res.status}`);
        const json = await res.json();
        setChartImage(json.image);
      } catch (err) {
        setChartError(err.message);
      } finally {
        setChartLoading(false);
      }
    }
    fetchChart();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;

  const totalPages    = Math.ceil(data.length / ROWS_PER_PAGE);
  const totalOptPages = Math.ceil(optimizedData.length / ROWS_PER_PAGE);
  const pageData      = data.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const pageOptData   = optimizedData.slice(optPage * ROWS_PER_PAGE, (optPage + 1) * ROWS_PER_PAGE);

  return (
    <>
      {/* Chart */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Future Predictions Chart</h2>
        <div className="bg-white rounded-lg shadow-md p-4 flex justify-center">
          {chartLoading ? (
            <LoadingSpinner />
          ) : chartError ? (
            <ErrorMessage message={chartError} />
          ) : (
            <img
              src={chartImage}
              alt="Future Predictions Chart"
              className="max-w-full h-auto rounded"
            />
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Original Predictions */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">30-Day Predictions</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-right">New Blocks Leased</th>
                  <th className="px-4 py-2 text-right">Workloads</th>
                  <th className="px-4 py-2 text-right">Atom %</th>
                  <th className="px-4 py-2 text-right">Photon %</th>
                  <th className="px-4 py-2 text-right">Spin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.map(item => (
                  <tr key={item.date}>
                    <td className="px-4 py-2">{item.date}</td>
                    <td className="px-4 py-2 text-right">{item.new_blocks_leased.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.workloads_executed.toFixed(0)}</td>
                    <td className="px-4 py-2 text-right">{item.Atom_percentage.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right">{item.Photon_percentage.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right">{item.Spin_percentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(p - 1, 0))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span>Page {page + 1} of {totalPages}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
              disabled={page + 1 === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* Optimized Predictions */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Optimized Predictions</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-right">Optimized Atom</th>
                  <th className="px-4 py-2 text-right">Optimized Photon</th>
                  <th className="px-4 py-2 text-right">Optimized Spin</th>
                  <th className="px-4 py-2 text-right">Cost Savings</th>
                  <th className="px-4 py-2 text-right">Savings %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageOptData.map(item => (
                  <tr key={item.date}>
                    <td className="px-4 py-2">{item.date}</td>
                    <td className="px-4 py-2 text-right">{item.optimized_Atom.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.optimized_Photon.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.optimized_Spin.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      ${Number(item.cost_savings).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2 text-right">{item.savings_percentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setOptPage(p => Math.max(p - 1, 0))}
              disabled={optPage === 0}
            >
              Previous
            </button>
            <span>Page {optPage + 1} of {totalOptPages}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setOptPage(p => Math.min(p + 1, totalOptPages - 1))}
              disabled={optPage + 1 === totalOptPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function BlockTypePieChart({ blocks }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Colors for the pie chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6A7FDB'];
  
  useEffect(() => {
    // Process the blocks data to format it for the pie chart
    const processData = () => {
      if (!blocks) return;
      
      // Transform the blocks object into an array format required by Recharts
      const formattedData = Object.entries(blocks).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));
      
      setChartData(formattedData);
      setIsLoading(false);
    };
    
    processData();
  }, [blocks]);
  
  if (isLoading) {
    return (
      <div className="w-full md:w-1/2">
        <h3 className="text-lg font-medium mb-2">Block Type Distribution</h3>
        <div className="bg-gray-100 p-4 rounded-md h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full md:w-1/2">
      <h3 className="text-lg font-medium mb-2">Block Type Distribution</h3>
      <div className="bg-gray-100 p-4 rounded-md h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} blocks`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}


function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
}

export default App;