import React from 'react';
import RobotsGeneratorTool from '../Tools/RobotsGeneratorTool';

export default function RobotsTab({ pages, targetUrl, addToast }) {
  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">robots.txt generator</h2>
          <p className="section-subtitle">Decide which crawlers can access which parts of your site, then download the file for your site root.</p>
        </div>
      </div>

      <RobotsGeneratorTool pages={pages} targetUrl={targetUrl} addToast={addToast} />
    </div>
  );
}
