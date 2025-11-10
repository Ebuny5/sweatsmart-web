import React from 'react';
const Sidebar: React.FC = () => {
  return (
    <nav>
      <h2>SweatSmart</h2>
      <ul>
        <li>
          <a href="/dashboard">Ã°Å¸â€œÅ  Dashboard</a>
        </li>
        <li>
          <a href="/log-episode">+ Log Episode</a>
        </li>
        <li>
          <a href="/history">Ã°Å¸â€œâ€¦ History</a>
        </li>
        <li>
          <a href="/insights">Ã°Å¸â€™Â¡ Insights</a>
        </li>
        <li>
          <a href="/palm-scanner">Ã°Å¸â€œÂ¸ Palm Scanner</a>
        </li>
        <li>
          <a href="/climate-alert">â›…ï¸  Climate Alert</a>
        </li>
        <li>
          <a href="/community">Ã°Å¸â€™Â¬ Community</a>
        </li>
        <li>
          <a href="/feedback">Ã°Å¸â€”Â£Ã¯Â¸  Feedback</a>
        </li>
        <li>
          <a href="/settings">Ã¢Å¡â„¢Ã¯Â¸  Settings</a>
        </li>
      </ul>
    </nav>
  );
};
export default Sidebar;