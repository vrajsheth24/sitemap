import React from 'react';
import SchemaTool from '../Tools/SchemaTool';

export default function SchemaTab({ pages, targetUrl, addToast }) {
  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Schema generator</h2>
          <p className="section-subtitle">Build JSON-LD structured data so search engines can show rich results for your pages.</p>
        </div>
      </div>

      <SchemaTool pages={pages} targetUrl={targetUrl} addToast={addToast} />
    </div>
  );
}
