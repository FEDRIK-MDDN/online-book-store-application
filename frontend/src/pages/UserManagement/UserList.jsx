import React from 'react';

export default function UserList() {
  // Placeholder list; replace with API integration as needed
  const users = [];
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Users</h2>
        {users.length === 0 ? (
          <p>No users to display.</p>
        ) : (
          <ul>
            {users.map((u) => (
              <li key={u.id}>{u.name} ({u.email})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
