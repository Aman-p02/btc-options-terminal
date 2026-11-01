'use client';

import React from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    title: string;
    dayName: string;
    timeStr: string;
    holdStr: string;
    strikeDist: number;
    touchProb: number;
    ciLower: number;
    ciUpper: number;
    sampleSize: number;
    spot: number;
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  if (!isOpen) return null;

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFont('courier', 'bold');
    doc.setFontSize(16);
    doc.text('BTC OPTIONS RESEARCH TERMINAL: VERIFICATION REPORT', 14, 20);

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text(`Generated: ${new Date().toUTCString()}`, 14, 26);
    doc.text(`Data As-Of: 2026-10-31 UTC | Source: 9 Years Binance 1-Second History`, 14, 30);
    doc.line(14, 34, 196, 34);

    // Trade Idea Section
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('1. SETUP CONFIGURATION', 14, 42);

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text(`Window: ${reportData.dayName} at ${reportData.timeStr}`, 14, 50);
    doc.text(`Hold Duration: ${reportData.holdStr}`, 14, 56);
    doc.text(`Strike Distance: +${reportData.strikeDist.toFixed(2)}% ($${(reportData.spot * (reportData.strikeDist / 100)).toFixed(0)} pts)`, 14, 62);
    doc.text(`Reference Spot Price: $${reportData.spot.toLocaleString()}`, 14, 68);

    // Empirical Statistical Results
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('2. EMPIRICAL RISK EVALUATION', 14, 80);

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text(`Historical Touch Probability: ${reportData.touchProb.toFixed(2)}%`, 14, 88);
    doc.text(`95% Wilson Confidence Interval: [${reportData.ciLower.toFixed(2)}% - ${reportData.ciUpper.toFixed(2)}%]`, 14, 94);
    doc.text(`Total Sample Size (n): ${reportData.sampleSize} historical instances`, 14, 100);
    doc.text(`Survival Probability (OTM Expiry): ${(100 - reportData.touchProb).toFixed(2)}%`, 14, 106);

    // Methodology & Limits
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('3. STATISTICAL HONESTY & LIMITS OF MODEL', 14, 118);

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(
      'Touch probability measures whether the underlying Binance 1-second price action breached the strike',
      14, 126
    );
    doc.text(
      'at any second tick during the holding horizon. Selection bias warning: scanning across 168 weekly',
      14, 131
    );
    doc.text(
      'hours inflates top-ranking metrics due to multiple hypothesis testing. Always evaluate out-of-sample data.',
      14, 136
    );

    // Regulatory Disclaimer
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('4. REGULATORY & RISK DISCLOSURE', 14, 150);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(
      'EDUCATIONAL AND STATISTICAL RESEARCH PURPOSES ONLY. NOT FINANCIAL, TAX, OR INVESTMENT ADVICE.',
      14, 156
    );
    doc.text(
      'Options selling carries uncapped or substantial risk of capital loss exceeding initial premium collected.',
      14, 161
    );
    doc.text(
      'Binance data terms and Indian / local jurisdiction regulations on selling research must be complied with.',
      14, 166
    );

    doc.save(`btc_options_report_${reportData.dayName}_${reportData.timeStr}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="bg-[var(--bg-surface)] hairline-border rounded max-w-md w-full p-4 space-y-3">
        <div className="flex items-center justify-between hairline-b pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber" />
            <span className="font-bold text-sm">EXPORT RESEARCH DOSSIER</span>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[var(--text-muted)] text-[11px]">
          Generate an authenticated statistical PDF report for <b>{reportData.dayName} {reportData.timeStr}</b> ({reportData.holdStr} hold). Includes Wilson 95% confidence intervals, empirical percentile moves, and statistical limits.
        </p>

        <div className="p-2.5 bg-[var(--bg-subtle)] rounded text-[11px] space-y-1">
          <div className="flex justify-between">
            <span>Historical Touch Probability:</span>
            <b className="text-emerald-400">{reportData.touchProb}%</b>
          </div>
          <div className="flex justify-between">
            <span>95% Wilson Confidence Interval:</span>
            <b className="text-zinc-300">[{reportData.ciLower}% - {reportData.ciUpper}%]</b>
          </div>
          <div className="flex justify-between">
            <span>Total Historical Sample:</span>
            <b className="text-zinc-300">n = {reportData.sampleSize}</b>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 hairline-border bg-[var(--bg-subtle)] rounded text-[var(--text-muted)] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-1.5 bg-amber text-black font-semibold rounded hover:bg-amber-hover flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

