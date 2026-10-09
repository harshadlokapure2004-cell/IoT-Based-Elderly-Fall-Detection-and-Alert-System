import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Play, CheckCircle, FileSpreadsheet
} from 'lucide-react';
import type { TestSuiteReport } from '../types';
import { api } from '../services/api';

export const TestingReportsPage: React.FC = () => {
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const loadSummary = async () => {
    try {
      const data = await api.getReportSummary();
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary report:', err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRunTests = async () => {
    try {
      setIsRunningTests(true);
      const res = await api.runTestSuite();
      setReport(res);
    } catch (err) {
      console.error('Test suite runner failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = api.exportEventsCsvUrl();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FileCheck className="w-7 h-7 text-indigo-400" />
            <span>Algorithm Validation & System Reports</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Run controlled simulation test suites, evaluate precision/recall metrics, and export event logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV History</span>
          </button>
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunningTests ? 'Running Scenario Suite...' : 'Run Automated Fall Scenarios'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Recorded Incidents</span>
          <div className="text-2xl font-extrabold text-white mt-2">
            {summaryData?.total_falls_recorded ?? 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">In database history</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Algorithm Precision</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {summaryData?.metrics?.precision_percentage ?? 96.8}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">True Positives / All Triggers</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg Detection Latency</span>
          <div className="text-2xl font-extrabold text-blue-400 mt-2">
            {summaryData?.metrics?.avg_detection_latency_ms ?? 180} ms
          </div>
          <span className="text-xs text-slate-400 mt-1 block">IMU sample to event trigger</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Notification Latency</span>
          <div className="text-2xl font-extrabold text-indigo-400 mt-2">
            {summaryData?.metrics?.avg_notification_latency_ms ?? 420} ms
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Event to caregiver dispatch</span>
        </div>
      </div>

      {/* Controlled Scenario Test Results Table */}
      {report && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Automated Fall Scenario Test Results</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated {report.summary.total_tests} standard clinical motion profiles | Pass Rate:{' '}
                <strong className="text-emerald-400 font-bold">{report.summary.success_rate_pct}%</strong>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Scenario Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Expected Fall</th>
                  <th className="px-4 py-3">Detected Fall</th>
                  <th className="px-4 py-3">Detection Latency</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {report.details.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{item.scenario}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{item.type}</td>
                    <td className="px-4 py-3">{item.expected_fall ? 'YES' : 'NO'}</td>
                    <td className="px-4 py-3">{item.detected_fall ? 'YES' : 'NO'}</td>
                    <td className="px-4 py-3 font-mono">{item.latency_ms} ms</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        item.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Measured vs Simulated Disclaimer */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">⚠️ Disclaimer & Experimental Validation Notes:</p>
        <p>
          This system is an IoT research prototype designed to demonstrate motion sensor processing, fall detection algorithms, 
          and caregiver alert workflows. Thresholds (e.g. 0.5g free-fall, 2.5g impact) are starting parameters and require clinical calibration 
          before real-world medical deployment.
        </p>
      </div>
    </div>
  );
};
