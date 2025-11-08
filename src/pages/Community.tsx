import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <nav>
      <h2>Climate Aware Notifications</h2>
      <ul>
        <li>
          <a href="/climate-notifications">Climate Notifications</a>
        </li>
        <li>
          <a href="/community">Community</a>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;